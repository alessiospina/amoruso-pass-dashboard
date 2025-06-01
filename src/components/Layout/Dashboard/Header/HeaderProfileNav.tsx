import {
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
} from 'react-bootstrap'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PropsWithChildren } from 'react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faPowerOff } from '@fortawesome/free-solid-svg-icons'
import HeaderLogout from '@/components/Layout/Dashboard/Header/HeaderLogout'
import { authOptions } from '@/app/api/auth/option'
import { getServerSession } from 'next-auth'
import { getDictionary } from '@/locales/dictionary'

type ItemWithIconProps = {
  icon: IconDefinition;
} & PropsWithChildren

const ItemWithIcon = (props: ItemWithIconProps) => {
  const { icon, children } = props

  return (
    <>
      <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
      {children}
    </>
  )
}

export default async function HeaderProfileNav() {
  const session = await getServerSession(authOptions)
  const dict = await getDictionary()

  // Nome utente di default per ora
  const defaultUserName = "Admin User"

  return (
    <Nav>
      <Dropdown as={NavItem}>
        <DropdownToggle variant="link" bsPrefix="hide-caret" className="py-0 px-2 rounded-0" id="dropdown-profile">
          <div className="avatar position-relative">
            {session ? (
              <Image
                fill
                sizes="32px"
                className="rounded-circle"
                src={session.user.avatar}
                alt={session.user.email}
              />
            ) : (
              <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width: '32px', height: '32px', fontSize: '14px'}}>
                {defaultUserName.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
        </DropdownToggle>
        <DropdownMenu className="pt-0">
          <DropdownHeader className="fw-bold rounded-top">
            {session ? session.user.email : defaultUserName}
          </DropdownHeader>

          <DropdownDivider />

          <HeaderLogout>
            <DropdownItem>
              <ItemWithIcon icon={faPowerOff}>{dict.profile.logout}</ItemWithIcon>
            </DropdownItem>
          </HeaderLogout>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  )
}
