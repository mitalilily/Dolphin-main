import { Box, ChakraProvider, Portal, useColorModeValue, useDisclosure } from '@chakra-ui/react'
import Configurator from 'components/Configurator/Configurator'
import Footer from 'components/Footer/Footer.js'
import '@fontsource/open-sans/400.css'
import '@fontsource/open-sans/600.css'
import '@fontsource/raleway/600.css'
import '@fontsource/raleway/700.css'
import AdminNavbar from 'components/Navbars/AdminNavbar.js'
import Sidebar from 'components/Sidebar'
import { useEffect, useState } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import routes from 'routes.js'
import theme from 'theme/theme.js'
import FixedPlugin from '../components/FixedPlugin/FixedPlugin'
import MainPanel from '../components/Layout/MainPanel'
import PanelContainer from '../components/Layout/PanelContainer'
import PanelContent from '../components/Layout/PanelContent'

export default function Dashboard(props) {
  const { ...rest } = props
  const [sidebarVariant, setSidebarVariant] = useState('transparent')
  const [fixed, setFixed] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(292)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing) {
        const newWidth = Math.min(Math.max(e.clientX, 240), 360)
        setSidebarWidth(newWidth)
      }
    }
    const handleMouseUp = () => setIsResizing(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const getRoute = () => window.location.pathname !== '/admin/full-screen-maps'

  const getActiveRoute = (allRoutes) => {
    let activeRoute = 'Default Brand Text'
    for (let i = 0; i < allRoutes.length; i++) {
      if (allRoutes[i].collapse || allRoutes[i].category) {
        const nestedRoute = getActiveRoute(allRoutes[i].views)
        if (nestedRoute !== activeRoute) return nestedRoute
      } else if (window.location.href.indexOf(allRoutes[i].layout + allRoutes[i].path) !== -1) {
        return allRoutes[i].name
      }
    }
    return activeRoute
  }

  const getActiveNavbar = (allRoutes) => {
    let activeNavbar = false
    for (let i = 0; i < allRoutes.length; i++) {
      if (allRoutes[i].category) {
        const categoryNavbar = getActiveNavbar(allRoutes[i].views)
        if (categoryNavbar !== activeNavbar) return categoryNavbar
      } else if (window.location.href.indexOf(allRoutes[i].layout + allRoutes[i].path) !== -1) {
        if (allRoutes[i].secondaryNavbar) return allRoutes[i].secondaryNavbar
      }
    }
    return activeNavbar
  }

  const getRoutes = (allRoutes) =>
    allRoutes.map((prop, key) => {
      if (prop.collapse || prop.category) return getRoutes(prop.views)
      if (prop.layout === '/admin') {
        return <Route path={prop.layout + prop.path} component={prop.component} key={key} />
      }
      return null
    })

  const { isOpen, onOpen, onClose } = useDisclosure()
  document.documentElement.dir = 'ltr'

  return (
    <ChakraProvider theme={theme} resetCss={false}>
      <Sidebar
        routes={routes}
        logoText={'SkyRush Express Courier'}
        sidebarVariant={sidebarVariant}
        sidebarWidth={sidebarWidth}
        {...rest}
      />

      <MainPanel
        w={{
          base: '100%',
          xl: `calc(100% - ${sidebarWidth}px)`,
        }}
        ml={{ xl: `${sidebarWidth}px` }}
      >
        <Portal>
          <AdminNavbar
            onOpen={onOpen}
            logoText={'SkyRush Express Courier'}
            brandText={getActiveRoute(routes)}
            secondary={getActiveNavbar(routes)}
            fixed={fixed}
            sidebarWidth={sidebarWidth}
            {...rest}
          />
        </Portal>
        {getRoute() ? (
          <PanelContent>
            <PanelContainer>
              <Switch>
                {getRoutes(routes)}
                <Redirect from="/admin" to="/admin/dashboard" />
              </Switch>
            </PanelContainer>
          </PanelContent>
        ) : null}
        <Footer />
        <Portal>
          <FixedPlugin secondary={getActiveNavbar(routes)} fixed={fixed} onOpen={onOpen} />
        </Portal>
        <Configurator
          secondary={getActiveNavbar(routes)}
          isOpen={isOpen}
          onClose={onClose}
          isChecked={fixed}
          onSwitch={(value) => setFixed(value)}
          onOpaque={() => setSidebarVariant('opaque')}
          onTransparent={() => setSidebarVariant('transparent')}
        />
      </MainPanel>

      <Box
        position="fixed"
        left={`${sidebarWidth - 2}px`}
        top="0"
        h="100vh"
        w="4px"
        cursor="col-resize"
        zIndex="1400"
        bg={isResizing ? useColorModeValue('rgba(12,59,128,0.16)', 'rgba(255,255,255,0.18)') : 'transparent'}
        _hover={{ bg: useColorModeValue('rgba(12,59,128,0.12)', 'rgba(255,255,255,0.14)') }}
        onMouseDown={() => setIsResizing(true)}
      />
    </ChakraProvider>
  )
}
