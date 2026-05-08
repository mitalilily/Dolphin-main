DELETE FROM shipping_rates
WHERE lower(coalesce(service_provider, '')) = 'juxcargo'
   OR lower(courier_name) LIKE '%juxcargo%';

DELETE FROM courier_credentials
WHERE lower(provider) = 'juxcargo';

DELETE FROM couriers
WHERE lower("serviceProvider") = 'juxcargo'
   OR lower(name) LIKE '%juxcargo%';
