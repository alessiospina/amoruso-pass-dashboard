'use client'

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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PropsWithChildren } from 'react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { faPowerOff } from '@fortawesome/free-solid-svg-icons'
import HeaderLogout from '@/components/Layout/Dashboard/Header/HeaderLogout'
import { useJWTAuth } from '@/hooks/useJWTAuth'
import useDictionary from '@/locales/dictionary-hook'

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

export default function HeaderProfileNav() {
  const { user, isLoading } = useJWTAuth()
  const dict = useDictionary()

  if (isLoading) {
    return (
      <Nav>
        <NavItem>
          <div className="avatar position-relative">
            <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width: '32px', height: '32px', fontSize: '12px'}}>
              ...
            </div>
          </div>
        </NavItem>
      </Nav>
    )
  }

  // Nome utente semplice per ora
  const displayName = user?.name || user?.email || 'Admin User'

  return (
    <Nav>
      <Dropdown as={NavItem}>
        <DropdownToggle variant="link" bsPrefix="hide-caret" className="py-0 px-2 rounded-0" id="dropdown-profile">
          <div className="avatar position-relative">
            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white" style={{width: '32px', height: '32px', fontSize: '12px'}}>
              {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </DropdownToggle>
        <DropdownMenu className="pt-0">
          <DropdownHeader className="fw-bold rounded-top">
            {displayName}
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
