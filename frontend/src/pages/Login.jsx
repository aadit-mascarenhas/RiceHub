import { useState } from 'react'
import Layout from '../components/Layout'
import FormField from '../components/form/FormField'
import TextField from '../components/form/TextField'
import useForm from '../hooks/useForm'

const initialValues = { identifier: '', password: '' }

function validate(values) {
  const errors = {}
  if (!values.identifier.trim()) errors.identifier = '> ERR: IDENTIFIER_REQUIRED'
  if (!values.password) errors.password = '> ERR: PASSPHRASE_REQUIRED'
  return errors
}

export default function Login() {
  const [tab, setTab] = useState('login')
  const { values, errors, submitting, handleChange, handleSubmit } = useForm(
    initialValues,
    validate
  )

  const authenticate = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
  })

  return (
    <Layout>
      <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-surface">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, var(--color-on-surface) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Terminal decorations */}
        <div className="absolute left-8 top-8 z-0 hidden select-none font-mono text-sm leading-relaxed text-on-surface opacity-30 lg:block">
          <div>$ ssh admin@rice-hub</div>
          <div>Authenticating...</div>
          <div className="cursor-blink">_</div>
        </div>
        <div className="absolute bottom-8 right-8 z-0 hidden select-none text-right font-mono text-sm leading-relaxed text-on-surface opacity-30 lg:block">
          <div>[ ARCH-LINUX ]</div>
          <div>xorg-server 21.1.8-1</div>
          <div>bspwm 0.9.10-2</div>
        </div>

        {/* Auth card */}
        <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col space-y-8 border-2 border-primary bg-[#171717] p-6 shadow-hard lg:p-8">
          {/* Brand */}
          <div className="space-y-2 border-b-2 border-primary pb-6 text-center">
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-on-surface">
              RICE_HUB
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              [ AUTHENTICATION REQUIRED ]
            </p>
          </div>

          {/* Tabs */}
          <div className="relative flex border-b-2 border-primary">
            {['login', 'register'].map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-center font-mono text-sm uppercase transition-colors ${
                  tab === key
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-primary hover:bg-surface-container-low'
                }`}
              >
                {key}
              </button>
            ))}
            <span
              className="absolute bottom-0 left-0 h-[2px] w-1/2 bg-terminal-green transition-transform duration-300"
              style={{
                transform: tab === 'register' ? 'translateX(100%)' : 'translateX(0)',
              }}
            />
          </div>

          {/* Form */}
          <form onSubmit={authenticate} noValidate className="space-y-6">
            <div className="space-y-4">
              <FormField
                label="IDENTIFIER [ USER/EMAIL ]"
                htmlFor="identifier"
                error={errors.identifier}
                className="group space-y-2"
                labelClassName="block font-mono text-xs uppercase text-primary"
              >
                <TextField
                  prefix
                  name="identifier"
                  type="text"
                  placeholder="username"
                  autoComplete="off"
                  value={values.identifier}
                  onChange={handleChange}
                  hasError={Boolean(errors.identifier)}
                />
              </FormField>
              <FormField
                label="PASSPHRASE"
                htmlFor="password"
                error={errors.password}
                className="group space-y-2"
                labelClassName="block font-mono text-xs uppercase text-primary"
              >
                <TextField
                  prefix
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  hasError={Boolean(errors.password)}
                />
              </FormField>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden border-2 border-black bg-white py-4 font-display text-lg font-bold uppercase text-black shadow-hard transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-70"
            >
              <span className="relative z-10">
                {submitting ? 'AUTHENTICATING...' : 'ACCESS HUB'}
              </span>
              {!submitting && (
                <span className="material-symbols-outlined relative z-10 text-xl">login</span>
              )}
              <span className="absolute inset-0 origin-left scale-x-0 bg-terminal-green transition-transform duration-300 group-hover:scale-x-100" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-primary" />
              <span className="font-mono text-xs text-primary">OR EXECUTABLE</span>
              <div className="h-px flex-1 bg-primary" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 border-2 border-primary bg-[#171717] py-3 font-mono text-sm uppercase text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <span className="text-lg">G</span>
              Initialize via GitHub
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}