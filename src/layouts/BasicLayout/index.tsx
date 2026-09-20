import {
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  TableOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Breadcrumb, Button, Layout, Menu, theme } from 'antd'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import DarkModeToggle from '@/theme/DarkModeToggle'
import ThemeSwitcher from '@/theme/ThemeSwitcher'
import TagsView from '@/layouts/TagsView'
import { routeMetaMap } from '@/router/routes'
import { useThemeStore } from '@/store/theme'
import logo from '@/assets/logo.svg'
import './index.scss'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: '/recipe/list',
    icon: <UnorderedListOutlined />,
    label: '菜谱列表',
  },
  {
    key: '/categories',
    icon: <AppstoreOutlined />,
    label: '分类管理',
  },
  {
    key: '/banners',
    icon: <PictureOutlined />,
    label: '首页轮播',
  },
  {
    key: '/users',
    icon: <TeamOutlined />,
    label: '用户管理',
  },
  {
    key: '/access',
    icon: <UserOutlined />,
    label: '权限演示',
  },
  {
    key: '/table',
    icon: <TableOutlined />,
    label: 'CRUD 示例',
  },
]

export default function BasicLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = useThemeStore((s) => s.isDark)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const menuTheme = isDark ? 'dark' : 'light'

  const selectedKeys = useMemo(
    () => [routeMetaMap[location.pathname]?.active ?? location.pathname],
    [location.pathname],
  )

  const breadcrumbItems = useMemo(() => {
    const meta = routeMetaMap[location.pathname]
    if (!meta) {
      return [{ title: '菜谱管理' }]
    }

    const items: { title: ReactNode }[] = []
    if (meta.parent) {
      const parentPath =
        meta.parent === '菜谱列表'
          ? '/recipe/list'
          : meta.parent === '系统管理'
            ? '/users'
            : '/recipe/list'
      items.push({
        title: <Link to={parentPath}>{meta.parent}</Link>,
      })
    }

    if (location.pathname === '/recipe/detail') {
      const id = new URLSearchParams(location.search).get('id')
      items.push({ title: id ? `菜谱详情 ${id}` : meta.title })
    } else if (location.pathname === '/recipe/edit') {
      const id = new URLSearchParams(location.search).get('id')
      items.push({ title: id ? `编辑菜谱 ${id}` : meta.title })
    } else {
      items.push({ title: meta.title })
    }
    return items
  }, [location.pathname, location.search])

  return (
    <Layout className="basic-layout">
      <Sider
        theme={menuTheme}
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="basic-layout__sider"
      >
        <div className="basic-layout__logo">
          <img src={logo} alt="logo" className="basic-layout__logo-img" />
          {!collapsed && (
            <span className="basic-layout__logo-text">菜谱管理</span>
          )}
        </div>
        <Menu
          theme={menuTheme}
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          className="basic-layout__header"
          style={{ background: colorBgContainer }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
            className="basic-layout__trigger"
          />
          <Breadcrumb
            className="basic-layout__breadcrumb"
            items={breadcrumbItems}
          />
          <div className="basic-layout__header-actions">
            <DarkModeToggle />
            <ThemeSwitcher />
          </div>
        </Header>
        <TagsView />
        <Content
          className="basic-layout__content"
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
