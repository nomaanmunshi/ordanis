import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App'
import './styles.css'

const savedTheme = localStorage.getItem('ordanis-theme')
const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'dark'
document.documentElement.dataset.theme = initialTheme
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', initialTheme === 'dark' ? '#1A1614' : '#FAF9F7')

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 2_000, retry: (count, error) => { const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500; return status >= 500 && count < 2 } }, mutations: { retry: false } } })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={queryClient}><BrowserRouter basename={import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')}><App/></BrowserRouter></QueryClientProvider></React.StrictMode>,
)
