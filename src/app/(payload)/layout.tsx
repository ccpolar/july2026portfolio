import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { Inter } from 'next/font/google'
import React from 'react'

import { importMap } from './admin/importMap.js'

import '@payloadcms/next/css'
import './admin.css'

// The admin's typeface (the "alpine" redesign). Served from this site rather
// than Google's, and declared as a variable that admin.css reads as --alp-font.
const inter = Inter({
  subsets: ['latin'],
  variable: '--alp-font-inter',
  display: 'swap',
})

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

// Payload's RootLayout draws <html> itself, so the font variable goes on a
// wrapper that adds no box of its own — every admin view renders inside it.
const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <div className={`${inter.variable} alp-root`} style={{ display: 'contents' }}>
      {children}
    </div>
  </RootLayout>
)

export default Layout
