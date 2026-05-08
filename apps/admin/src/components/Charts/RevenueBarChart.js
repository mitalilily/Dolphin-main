import { useColorModeValue } from '@chakra-ui/react'
import Chart from 'react-apexcharts'
import { adminBrand } from 'theme/brand'

const formatChartDate = (value) => {
  const [year, month, day] = String(value || '')
    .split('-')
    .map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatCompactCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number(value) >= 1000 ? 1 : 0,
    notation: Number(value) >= 1000 ? 'compact' : 'standard',
  }).format(Number(value) || 0)

const RevenueBarChart = ({ data = [] }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400')
  const gridColor = useColorModeValue('gray.200', 'gray.700')

  const chartData = [
    {
      name: 'Revenue',
      data: data.map((item) => Math.round(item.revenue || 0)),
    },
  ]

  const chartOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      type: 'bar',
      height: '100%',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: false,
        columnWidth: '55%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatCompactCurrency(val),
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: [textColor],
        fontWeight: 600,
        fontFamily: 'Poppins, sans-serif',
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: [adminBrand.success, adminBrand.aqua, adminBrand.accent],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
        stops: [0, 50, 100],
      },
    },
    colors: [adminBrand.success],
    xaxis: {
      categories: data.map((item) => formatChartDate(item.date)),
      labels: {
        style: {
          colors: textColorSecondary,
          fontSize: '12px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColorSecondary,
          fontSize: '12px',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 500,
        },
        formatter: (val) => formatCompactCurrency(val),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    tooltip: {
      theme: useColorModeValue('light', 'dark'),
      style: {
        fontSize: '12px',
        fontFamily: 'Poppins, sans-serif',
      },
      y: {
        formatter: (val) =>
          new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(val),
      },
      marker: {
        show: true,
      },
    },
    legend: {
      show: false,
    },
  }

  return <Chart options={chartOptions} series={chartData} type="bar" width="100%" height="100%" />
}

export default RevenueBarChart
