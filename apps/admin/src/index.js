import { createRoot } from 'react-dom/client'

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AdminLayout from 'layouts/Admin.js'
import AuthLayout from 'layouts/Auth.js'
import RTLLayout from 'layouts/RTL.js'
import './index.css'

const queryClient = new QueryClient()

const root = createRoot(document.getElementById('root'))
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Switch>
        <Route path={`/auth`} component={AuthLayout} />
        <Route path={`/admin`} component={AdminLayout} />
        <Route path={`/rtl`} component={RTLLayout} />
        <Redirect from={`/`} to="/admin/dashboard" />
      </Switch>
    </BrowserRouter>

    {/* React Query devtools are kept for local debugging */}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
)
