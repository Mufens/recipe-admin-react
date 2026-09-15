import { KeepAlive } from 'react-activation'
import { Spin } from 'antd'
import { Navigate, useRoutes, useSearchParams } from 'react-router-dom'
import BasicLayout from '@/layouts/BasicLayout'
import Access from '@/pages/Access'
import Add from '@/pages/Home/add'
import Detail from '@/pages/Home/detail'
import Edit from '@/pages/Home/edit'
import Home from '@/pages/Home/list'
import CategoryPage from '@/pages/Category'
import UserList from '@/pages/User/list'
import TableDemo from '@/pages/Table'

function KeepAliveRecipeList() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/recipe/list">
        <Home />
      </KeepAlive>
    </div>
  )
}

function KeepAliveCategories() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/categories">
        <CategoryPage />
      </KeepAlive>
    </div>
  )
}

function KeepAliveUsers() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/users">
        <UserList />
      </KeepAlive>
    </div>
  )
}

function KeepAliveDetail() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  const name = id ? `/recipe/detail?id=${id}` : '/recipe/detail'
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name={name} id={id || undefined}>
        <Detail />
      </KeepAlive>
    </div>
  )
}

/** 编辑页不走 KeepAlive：按 id 缓存会在切换时闪「缺少菜谱 ID」，且表单也不宜缓存 */
function EditPage() {
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id')
  if (!id) {
    return (
      <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" description="加载中..." />
      </div>
    )
  }
  return <Edit key={id} />
}

function KeepAliveAdd() {
  return (
    <div style={{ height: '100%' }}>
      <KeepAlive name="/recipe/add">
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
        { index: true, element: <Navigate to="/recipe/list" replace /> },
        { path: 'recipe/list', element: <KeepAliveRecipeList /> },
        { path: 'recipe/detail', element: <KeepAliveDetail /> },
        { path: 'recipe/edit', element: <EditPage /> },
        { path: 'recipe/add', element: <KeepAliveAdd /> },
        { path: 'categories', element: <KeepAliveCategories /> },
        { path: 'users', element: <KeepAliveUsers /> },
        { path: 'access', element: <Access /> },
        { path: 'table', element: <TableDemo /> },
      ],
    },
    { path: '*', element: <Navigate to="/recipe/list" replace /> },
  ])
}
