import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Icon from "./Icons";
import { Field, Reveal } from "./primitives";
import { trackingStatuses } from "./siteData";
import { calculateShippingEstimate, isValidPincode } from "../../utils/shippingCalculator";

const MotionArticle = motion.article;
const MotionForm = motion.form;
const COURIER_CART_API = "https://api.couriercart.in/api";
const PINCODE_API = "https://api.postalpincode.in/pincode";
const paymentTypes = ["Prepaid", "COD"];
const rateBucketKeys = ["rates", "localRates", "regionalRates", "metroRates", "nationalRates", "zonalRates"];

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getCourierName(courier) {
  return courier?.name || courier?.courier_name || courier?.courierName || courier?.partner_name || "Courier";
}

function getCourierRateDetails(courier) {
  const knownBuckets = rateBucketKeys.map((key) => courier?.[key]?.forward);
  const nestedBuckets = Object.values(courier || {})
    .filter((value) => value && typeof value === "object" && !Array.isArray(value))
    .map((value) => value?.forward)
    .filter(Boolean);
  const forwardRate = [courier?.forward, courier?.rates?.forward, ...knownBuckets, ...nestedBuckets].find(
    (value) => value && (value.rate != null || value.mode)
  );

  return {
    mode: forwardRate?.mode || courier?.mode || "",
    rate: parseNumber(forwardRate?.rate ?? courier?.rate),
  };
}

function formatCurrency(amount) {
  return amount != null ? `Rs ${amount.toFixed(2)}` : "-";
}

function formatChargeableWeight(weight) {
  const numericWeight = parseNumber(weight);

  if (numericWeight == null || numericWeight <= 0) {
    return "-";
  }

  if (numericWeight >= 1000) {
    return `${(numericWeight / 1000).toFixed(2)} kg`;
  }

  if (numericWeight >= 100) {
    return `${numericWeight.toFixed(0)} g`;
  }

  return `${numericWeight.toFixed(2)} kg`;
}

function readStoredValue(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => readStoredValue(key, fallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Persistence is a convenience; the tools should still work if storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}

export function VolumetricCalculatorCard({
  className = "surface-card rounded-[2rem] p-6",
  defaultValues = { length: "40", width: "32", height: "28", divisor: "5000" },
}) {
  const [form, setForm] = usePersistentState("dolphin-volumetric-calculator", defaultValues);
  const length = Number(form.length) || 0;
  const width = Number(form.width) || 0;
  const height = Number(form.height) || 0;
  const divisor = Number(form.divisor) || 5000;
  const volumetricWeight = length && width && height ? (length * width * height) / divisor : 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <MotionArticle whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25 }} className={`${className} h-full`}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Icon name="calculator" />
        </span>
        <div>
          <h3 className="font-display text-2xl text-slate-900">Weight Calculator</h3>
          <p className="mt-1 text-sm text-slate-500">
            Work out volumetric and billable weight using carton dimensions and your preferred divisor.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Length (cm)" name="length" type="number" value={form.length} onChange={handleChange} placeholder="Enter length" />
        <Field label="Width (cm)" name="width" type="number" value={form.width} onChange={handleChange} placeholder="Enter width" />
        <Field label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} placeholder="Enter height" />
        <Field label="Divisor" name="divisor" type="number" value={form.divisor} onChange={handleChange} placeholder="Enter divisor" />
      </div>

      <div className="mt-6 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
        <div className="border-l-4 border-sky-300 pl-4 text-slate-900">
          <p className="text-sm text-slate-600">Volumetric weight</p>
          <p className="mt-3 font-display text-4xl">
            {volumetricWeight.toFixed(2)} <span className="text-xl text-slate-500">kg</span>
          </p>
        </div>
        <div className="border-l-4 border-amber-200 pl-4">
          <p className="text-sm text-slate-500">Billable weight note</p>
          <p className="mt-3 text-lg font-semibold text-slate-900">(L x W x H) / divisor</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Shipping billing usually compares actual weight against dimensional weight and uses the higher figure.
          </p>
        </div>
      </div>
    </MotionArticle>
  );
}

export function RateCalculatorCard({
  className = "surface-card rounded-[2rem] p-6",
  defaultValues = {
    pickupPincode: "",
    deliveryPincode: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    shipmentValue: "",
    paymentType: "Prepaid",
  },
}) {
  const [form, setForm] = usePersistentState("dolphin-rate-calculator", defaultValues);
  const [pincodeMeta, setPincodeMeta] = useState({
    pickup: { city: "", state: "", loading: false, message: "", tone: "muted" },
    delivery: { city: "", state: "", loading: false, message: "", tone: "muted" },
  });
  const [couriers, setCouriers] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [calculatorError, setCalculatorError] = useState("");
  const [showEstimate, setShowEstimate] = useState(false);

  const estimate = useMemo(
    () =>
      calculateShippingEstimate({
        weightInGrams: form.weight,
        length: form.length,
        width: form.width,
        height: form.height,
        pickupPincode: form.pickupPincode,
        deliveryPincode: form.deliveryPincode,
        paymentType: form.paymentType,
        shipmentValue: form.shipmentValue,
      }),
    [
      form.deliveryPincode,
      form.height,
      form.length,
      form.paymentType,
      form.pickupPincode,
      form.shipmentValue,
      form.weight,
      form.width,
    ]
  );

  const validationError = useMemo(() => {
    if (!isValidPincode(form.pickupPincode)) {
      return "Enter a valid 6-digit pickup pincode.";
    }

    if (!isValidPincode(form.deliveryPincode)) {
      return "Enter a valid 6-digit delivery pincode.";
    }

    if (estimate.chargeableWeightKg <= 0) {
      return "Enter a valid shipment weight or dimensions.";
    }

    if (form.paymentType === "COD" && !(Number(form.shipmentValue) > 0)) {
      return "Enter the shipment value for COD orders.";
    }

    return "";
  }, [
    estimate.chargeableWeightKg,
    form.deliveryPincode,
    form.paymentType,
    form.pickupPincode,
    form.shipmentValue,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "pickupPincode" || name === "deliveryPincode" ? value.replace(/\D/g, "").slice(0, 6) : value;

    setForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const lookupPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) {
      return { city: "", state: "", message: "", tone: "muted" };
    }

    try {
      const response = await fetch(`${PINCODE_API}/${pincode}`);
      const data = await response.json();
      const postOffice = data?.[0]?.PostOffice?.[0];

      if (data?.[0]?.Status === "Success" && postOffice) {
        return {
          city: postOffice.District || "",
          state: postOffice.State || "",
          message: "",
          tone: "muted",
        };
      }

      return { city: "", state: "", message: "Pincode details not found.", tone: "error" };
    } catch {
      return {
        city: "",
        state: "",
        message: "City/state lookup is unavailable right now.",
        tone: "muted",
      };
    }
  };

  useEffect(() => {
    if (form.pickupPincode.length !== 6) {
      setPincodeMeta((current) => ({
        ...current,
        pickup: { city: "", state: "", loading: false, message: "", tone: "muted" },
      }));
      return undefined;
    }

    let ignore = false;
    setPincodeMeta((current) => ({
      ...current,
      pickup: { ...current.pickup, loading: true, message: "", tone: "muted" },
    }));

    lookupPincode(form.pickupPincode).then((result) => {
      if (!ignore) {
        setPincodeMeta((current) => ({ ...current, pickup: { ...result, loading: false } }));
      }
    });

    return () => {
      ignore = true;
    };
  }, [form.pickupPincode]);

  useEffect(() => {
    if (form.deliveryPincode.length !== 6) {
      setPincodeMeta((current) => ({
        ...current,
        delivery: { city: "", state: "", loading: false, message: "", tone: "muted" },
      }));
      return undefined;
    }

    let ignore = false;
    setPincodeMeta((current) => ({
      ...current,
      delivery: { ...current.delivery, loading: true, message: "", tone: "muted" },
    }));

    lookupPincode(form.deliveryPincode).then((result) => {
      if (!ignore) {
        setPincodeMeta((current) => ({ ...current, delivery: { ...result, loading: false } }));
      }
    });

    return () => {
      ignore = true;
    };
  }, [form.deliveryPincode]);

  const handleCalculate = async () => {
    setShowEstimate(true);
    setCouriers([]);
    setCalculatorError("");

    if (validationError) {
      setCalculatorError(validationError);
      return;
    }

    setCalculating(true);

    try {
      const payload = {
        origin: form.pickupPincode,
        destination: form.deliveryPincode,
        payment_type: form.paymentType === "COD" ? "cod" : "prepaid",
        weight: Math.max(Math.round(estimate.chargeableWeightKg * 1000), Number(form.weight) || 0),
      };

      if (Number(form.length) > 0) {
        payload.length = form.length;
      }

      if (Number(form.width) > 0) {
        payload.breadth = form.width;
      }

      if (Number(form.height) > 0) {
        payload.height = form.height;
      }

      if (form.paymentType === "COD") {
        payload.order_amount = form.shipmentValue;
      }

      const response = await fetch(`${COURIER_CART_API}/couriers/available-to-guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (Array.isArray(data?.data) && data.data.length > 0) {
          setCouriers(data.data.slice(0, 5));
        } else {
          setCalculatorError("Live courier rates are unavailable for these details. Showing an indicative estimate below.");
        }
      } else {
        setCalculatorError(data?.error || "Live courier rates are unavailable right now. Showing an indicative estimate below.");
      }
    } catch (error) {
      console.error(error);
      setCalculatorError("Live courier rates are unavailable right now. Showing an indicative estimate below.");
    } finally {
      setCalculating(false);
    }
  };

  const renderPincodeMeta = (meta) => {
    if (meta.loading) {
      return <p className="ml-1.5 mt-1 text-sm text-slate-500">Loading...</p>;
    }

    if (meta.city) {
      return (
        <p className="ml-1.5 mt-1 text-sm text-slate-500">
          {meta.city}, {meta.state}
        </p>
      );
    }

    if (!meta.message) {
      return null;
    }

    const toneClass = meta.tone === "error" ? "text-red-500" : "text-slate-500";

    return <p className={`ml-1.5 mt-1 text-sm ${toneClass}`}>{meta.message}</p>;
  };

  const renderMode = (mode) => {
    if (!mode) {
      return "-";
    }

    const iconName = mode.toLowerCase() === "air" ? "rocket" : mode.toLowerCase() === "surface" ? "truck" : "route";

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-slate-800">
        <Icon name={iconName} className="h-4 w-4 text-sky-700" />
        {mode}
      </span>
    );
  };

  return (
    <MotionArticle whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25 }} className={`${className} h-full`}>
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Icon name="wallet" />
        </span>
        <div>
          <h3 className="font-display text-2xl text-slate-900">Rate Calculator</h3>
          <p className="mt-1 text-sm text-slate-500">
            Check available courier partners and live guest rates with pickup, delivery, weight, and dimensions.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <Field
            label="Pick-up Area Pincode"
            name="pickupPincode"
            value={form.pickupPincode}
            onChange={handleChange}
            placeholder="Enter pickup pincode"
          />
          {renderPincodeMeta(pincodeMeta.pickup)}
        </div>
        <div>
          <Field
            label="Delivery Area Pincode"
            name="deliveryPincode"
            value={form.deliveryPincode}
            onChange={handleChange}
            placeholder="Enter delivery pincode"
          />
          {renderPincodeMeta(pincodeMeta.delivery)}
        </div>
        <Field
          label="Actual Weight"
          name="weight"
          type="number"
          value={form.weight}
          onChange={handleChange}
          placeholder="Enter actual weight"
          postfix="GM"
        />
        <Field label="Length" name="length" type="number" value={form.length} onChange={handleChange} placeholder="Enter length" postfix="CM" />
        <Field label="Width" name="width" type="number" value={form.width} onChange={handleChange} placeholder="Enter width" postfix="CM" />
        <Field label="Height" name="height" type="number" value={form.height} onChange={handleChange} placeholder="Enter height" postfix="CM" />
        <Field
          label="Shipment Value"
          name="shipmentValue"
          type="number"
          value={form.shipmentValue}
          onChange={handleChange}
          placeholder="Enter shipment value"
          postfix="Rs"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          <span>Payment Type</span>
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            name="paymentType"
            value={form.paymentType}
            onChange={handleChange}
          >
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        disabled={calculating}
        onClick={handleCalculate}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {calculating ? "Calculating..." : "Calculate"}
      </button>

      {calculatorError ? <p className="mt-4 text-sm font-semibold text-red-500">{calculatorError}</p> : null}

      {showEstimate && estimate.chargeableWeightKg > 0 ? (
        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-3">
          <div className="border-l-4 border-amber-300 pl-4 text-slate-900">
            <p className="text-sm text-slate-600">Indicative estimate</p>
            <p className="mt-3 font-display text-4xl">{formatCurrency(estimate.estimatedCost)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Built from chargeable weight, delivery zone, and payment type so the calculator still returns a rate
              when live courier quotes are unavailable.
            </p>
          </div>
          <div className="border-l-4 border-sky-300 pl-4 text-slate-900">
            <p className="text-sm text-slate-500">Billable weight</p>
            <p className="mt-3 font-display text-3xl">{estimate.chargeableWeightKg.toFixed(2)} kg</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Actual: {estimate.actualWeightKg.toFixed(2)} kg
              <br />
              Volumetric: {estimate.volumetricWeightKg.toFixed(2)} kg
            </p>
          </div>
          <div className="border-l-4 border-emerald-300 pl-4 text-slate-900">
            <p className="text-sm text-slate-500">Zone and ETA</p>
            <p className="mt-3 font-display text-3xl">{estimate.zoneLabel}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Estimated transit: {estimate.eta}</p>
          </div>
        </div>
      ) : null}

      {couriers.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-[700px] table-auto text-left">
            <thead className="bg-sky-50 text-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">Courier Partner</th>
                <th className="px-4 py-3 font-semibold">Mode</th>
                <th className="px-4 py-3 font-semibold">Chargeable Weight</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier, index) => {
                const rateDetails = getCourierRateDetails(courier);

                return (
                  <motion.tr
                    key={`${getCourierName(courier)}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-slate-100 bg-white last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                      <span className="flex items-center gap-2">
                        <Icon name="package" className="h-4 w-4 text-sky-700" />
                        {getCourierName(courier)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{renderMode(rateDetails.mode)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatChargeableWeight(courier?.chargeable_weight)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-amber-700">
                      {formatCurrency(rateDetails.rate)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          <button
            type="button"
            className="m-4 inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-sky-50"
            onClick={() => window.open("https://app.couriercart.in/tools/rate_calculator", "_blank")}
          >
            Get Full Rate Card
          </button>
        </div>
      ) : null}
    </MotionArticle>
  );
}

function ToolPreview({ title, description, icon, fields, buttonLabel, to, accentClass }) {
  return (
    <MotionArticle whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.25 }} className="surface-card h-full rounded-[2rem] p-6">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}>
          <Icon name={icon} />
        </span>
        <div>
          <h3 className="font-display text-2xl text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-stone-200 bg-[#fffdf7] p-4">
        <div className="grid gap-3">
          {fields.map((field) => (
            <div key={field} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-slate-400">
              {field}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Open full tool</span>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3d971] text-slate-900 shadow-[0_12px_24px_rgba(215,188,77,0.22)]">
            <Icon name="arrowUpRight" className="h-4.5 w-4.5" />
          </span>
        </div>
      </div>

      <Link
        to={to}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-700"
      >
        <span className="border-b border-slate-900 pb-0.5">{buttonLabel}</span>
        <Icon name="arrowUpRight" className="h-4 w-4" />
      </Link>
    </MotionArticle>
  );
}

export function ShippingToolPlaceholders() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Reveal delay={0.08}>
        <ToolPreview
          title="Weight Calculator"
          description="Work out volumetric and billable weight using carton dimensions and your preferred divisor."
          icon="calculator"
          accentClass="bg-sky-100 text-sky-700"
          fields={["Enter length", "Enter width", "Enter height", "Enter divisor"]}
          buttonLabel="Open Weight Calculator"
          to="/volumetric-weight-calculator"
        />
      </Reveal>
      <Reveal delay={0.14}>
        <ToolPreview
          title="Rate Calculator"
          description="Estimate shipping charges by zone, service level, weight, and optional COD handling."
          icon="wallet"
          accentClass="bg-amber-100 text-amber-700"
          fields={["Enter weight", "Select zone", "Select service level", "Select COD handling"]}
          buttonLabel="Open Rate Calculator"
          to="/rate-calculator"
        />
      </Reveal>
    </div>
  );
}

export function TrackingPanel() {
  const location = useLocation();
  const storedTracking = readStoredValue("dolphin-tracking-panel", {
    awb: "DLP-2048127",
    searched: "DLP-2048127",
    mode: "Container",
  });
  const initialQuery = location.state?.query || storedTracking.awb || "DLP-2048127";
  const initialMode =
    location.state?.mode === "booking" ? "Booking Number" : location.state?.mode ? "Container" : storedTracking.mode;
  const [awb, setAwb] = useState(initialQuery);
  const [searched, setSearched] = useState(location.state?.query || storedTracking.searched || initialQuery);
  const [mode, setMode] = useState(initialMode);
  const timeline = useMemo(
    () =>
      trackingStatuses.map((status, index) => ({
        ...status,
        complete: index < 3,
        active: index === 2,
      })),
    []
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setSearched(awb || "DLP-2048127");
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("dolphin-tracking-panel", JSON.stringify({ awb, searched, mode }));
    } catch {
      // Tracking still works without local storage.
    }
  }, [awb, searched, mode]);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <Reveal delay={0.05}>
        <MotionForm
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.25 }}
          onSubmit={handleSubmit}
          className="surface-card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-6"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Icon name="route" />
            </span>
            <div>
              <h3 className="font-display text-2xl text-slate-900">Shipment tracking</h3>
              <p className="mt-1 text-sm text-slate-500">Enter a reference number to preview the tracking experience.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-700">
            {["Container", "Booking Number"].map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="trackingType"
                  className="h-4 w-4 accent-slate-900"
                  checked={mode === option}
                  onChange={() => setMode(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field
              label="Tracking number"
              name="awb"
              value={awb}
              onChange={(event) => setAwb(event.target.value)}
              placeholder="Enter container/billing number"
            />
            <button
              type="submit"
              className="mt-auto inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#f3d971] px-6 text-sm font-semibold text-slate-900 transition hover:bg-[#efcf54]"
            >
              Search
            </button>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(198,231,255,0.92),rgba(255,221,174,0.88))] px-5 py-5 text-slate-900 shadow-sm">
            <p className="text-sm text-slate-600">Latest lookup</p>
            <p className="mt-2 break-all font-display text-2xl sm:text-3xl">{searched}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{mode}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Current preview shows a shipment that is out for delivery and ready for final customer notification.
            </p>
          </div>
        </MotionForm>
      </Reveal>

      <Reveal delay={0.12}>
        <MotionArticle
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ duration: 0.25 }}
          className="surface-card rounded-[1.6rem] p-5 sm:rounded-[2rem] sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Tracking timeline</p>
              <h3 className="mt-2 font-display text-2xl text-slate-900">Delivery journey snapshot</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Out for delivery
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {timeline.map((item, index) => (
              <div key={item.title} className="flex gap-4 rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <span
                  className={[
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                    item.complete ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  <Icon name={item.complete ? "shield" : "route"} className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.active ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-700">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">Step 0{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </MotionArticle>
      </Reveal>
    </div>
  );
}
