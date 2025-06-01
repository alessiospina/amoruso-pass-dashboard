import { Nav, NavItem } from 'react-bootstrap'
import HeaderTheme from '@/components/Layout/Dashboard/Header/HeaderTheme'
import { getPreferredTheme } from '@/themes/theme'

export default async function HeaderNotificationNav() {
  return (
    <Nav>
      <NavItem>
        <HeaderTheme currentPreferredTheme={getPreferredTheme()} />
      </NavItem>
    </Nav>
  )
}
