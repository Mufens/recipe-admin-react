import { KeepAlive } from 'react-activation'
import { Navigate, useRoutes, useSearchParams } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'
import Access from '@/pages/Access'
import Add from '@/pages/Home/add'
import Detail from '@/pages/Home/detail'
import Home from '@/pages/Home/list'
import TableDemo from '@/pages/Table'

function KeepAliveHome() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/home">
        <Home />
      </KeepAlive>
    </div>
  )
}

function KeepAliveDetail() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const name = id ? `/detail?id=${id}` : '/detail'
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name={name} id={id || undefined}>
        <Detail />
      </KeepAlive>
    </div>
  )
}

function KeepAliveAdd() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/add">
        <Add />
      </KeepAlive>
    </div>
  )
}

export default function AppRouter() {
  return useRoutes([
    {
      path: '/',
      element: <BasicLayout />,
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: 'home', element: <KeepAliveHome /> },
        { path: 'detail', element: <KeepAliveDetail /> },
        { path: 'add', element: <KeepAliveAdd /> },
        { path: 'access', element: <Access /> },
        { path: 'table', element: <TableDemo /> },
      ],
    },
    { path: '*', element: <Navigate to="/home" replace /> },
  ])
}
