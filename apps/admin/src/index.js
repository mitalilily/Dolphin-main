import { createRoot } from 'react-dom/client'

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AdminLayout from 'layouts/Admin.js'
import AuthLayout from 'layouts/Auth.js'
import RTLLayout from 'layouts/RTL.js'
import { AdminRoute } from 'views/Auth/AdminRoute'
import './index.css'

const queryClient = new QueryClient()
const isDev = process.env.NODE_ENV !== 'production'

const root = createRoot(document.getElementById('root'))
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Switch>
        <Route path={`/auth`} component={AuthLayout} />
        <Route
          path={`/admin`}
          render={(props) => (
            <AdminRoute>
              <AdminLayout {...props} />
            </AdminRoute>
          )}
        />
        <Route path={`/rtl`} component={RTLLayout} />
        <Redirect from={`/`} to="/auth/signin" />
      </Switch>
    </BrowserRouter>

    {/* React Query devtools only in development to avoid extra runtime overhead */}
    {isDev ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>,
)
