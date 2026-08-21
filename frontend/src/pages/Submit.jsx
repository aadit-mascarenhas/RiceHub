import { useState } from 'react'
import Layout from '../components/Layout'
import FormField from '../components/form/FormField'
import TextField from '../components/form/TextField'
import SelectField from '../components/form/SelectField'
import useForm from '../hooks/useForm'

const initialValues = {
  title: '',
  description: '',
  distro: '',
  wm: '',
  bar: '',
  launcher: '',
  terminal: '',
  colorScheme: '',
  imageUrl: '',
  dotfilesUrl: '',
}

const SPEC_FIELDS = [
  {
    name: 'distro',
    label: 'DISTRIBUTION',
    type: 'select',
    required: true,
    placeholder: 'SELECT_OS...',
    options: ['Arch', 'Debian', 'Ubuntu', 'Fedora', 'NixOS', 'Other'],
  },
  { name: 'wm', label: 'WINDOW_MANAGER', required: true, placeholder: 'e.g. HYPRLAND, I3...' },
  { name: 'bar', label: 'BAR', placeholder: 'e.g. WAYBAR...' },
  { name: 'launcher', label: 'LAUNCHER', placeholder: 'e.g. ROFI...' },
  { name: 'terminal', label: 'TERMINAL', placeholder: 'e.g. ALACRITTY...' },
  {
    name: 'colorScheme',
    label: 'COLOR_SCHEME',
    type: 'select',
    placeholder: 'SELECT_THEME...',
    options: ['Catppuccin', 'Nord', 'Gruvbox', 'Dracula', 'Custom'],
  },
]

function validate(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = '> ERR: TITLE_REQUIRED'
  if (!values.distro) errors.distro = '> ERR: DISTRO_REQUIRED'
  if (!values.wm.trim()) errors.wm = '> ERR: WM_REQUIRED'
  if (!values.dotfilesUrl.trim()) {
    errors.dotfilesUrl = '> ERR: DOTFILES_URL_REQUIRED'
  } else if (!/^https?:\/\/.+\..+/.test(values.dotfilesUrl.trim())) {
    errors.dotfilesUrl = '> ERR: VALID_URL_REQUIRED'
  }
  return errors
}

export default function Submit() {
  const { values, errors, submitting, handleChange, handleSubmit, reset } =
    useForm(initialValues, validate)
  const [submitted, setSubmitted] = useState(false)

  const submitRice = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitted(true)
    reset()
  })

  return (
    <Layout>
      <div className="mx-auto w-full max-w-page px-4 py-12 lg:px-12">
        {/* Page header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-tighter text-on-surface lg:text-5xl">
              SUBMIT RICE
            </h1>
            <p className="mt-2 font-mono text-sm uppercase text-on-surface-variant">
              &gt; UPLOAD YOUR SETUP TO THE DATABASE_
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-3 w-3 animate-pulse bg-terminal-green" />
            <span className="font-mono text-sm text-terminal-green">SYSTEM_READY</span>
          </div>
        </div>

        {submitted && (
          <p className="mb-8 border-2 border-terminal-green bg-surface-container p-4 font-mono text-sm text-terminal-green">
            &gt; RICE_SUBMITTED_SUCCESSFULLY — IT_WILL_APPEAR_IN_THE_GALLERY_AFTER_REVIEW_
          </p>
        )}

        {/* Form card */}
        <form
          onSubmit={submitRice}
          noValidate
          className="relative mx-auto w-full max-w-3xl border-2 border-outline bg-surface-container shadow-hard"
        >
          <div className="absolute -top-4 left-4 border-2 border-outline bg-background px-4 py-1 font-mono text-xs uppercase text-on-surface">
            RICE_SUBMISSION_FORM_v1.0
          </div>

          <div className="space-y-12 p-6 sm:p-10">
            {/* BASIC_INFO */}
            <Section title="BASIC_INFO">
              <FormField label="RICE_TITLE" required error={errors.title}>
                <TextField
                  name="title"
                  value={values.title}
                  onChange={handleChange}
                  placeholder="ENTER_TITLE..."
                  hasError={Boolean(errors.title)}
                />
              </FormField>
              <FormField label="DESCRIPTION">
                <textarea
                  name="description"
                  value={values.description}
                  onChange={handleChange}
                  placeholder="DESCRIBE_YOUR_SETUP..."
                  rows={4}
                  className="w-full resize-y border-2 border-outline bg-surface p-4 font-mono text-sm text-on-surface transition-all placeholder:text-surface-bright focus:border-terminal-green focus:shadow-hard-green-sm focus:outline-none"
                />
              </FormField>
            </Section>

            {/* SPECS */}
            <Section title="SPECS">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {SPEC_FIELDS.map((field) => (
                  <FormField
                    key={field.name}
                    label={field.label}
                    required={field.required}
                    error={errors[field.name]}
                  >
                    {field.type === 'select' ? (
                      <SelectField
                        name={field.name}
                        value={values[field.name]}
                        onChange={handleChange}
                        hasError={Boolean(errors[field.name])}
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </SelectField>
                    ) : (
                      <TextField
                        name={field.name}
                        value={values[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        hasError={Boolean(errors[field.name])}
                      />
                    )}
                  </FormField>
                ))}
              </div>
            </Section>

            {/* MEDIA */}
            <Section title="MEDIA">
              <FormField
                label="SCREENSHOT_URL"
                hint="PASTE_A_LINK_TO_YOUR_SCREENSHOT"
              >
                <TextField
                  name="imageUrl"
                  value={values.imageUrl}
                  onChange={handleChange}
                  placeholder="HTTPS://IIMGUR.COM/SCREENSHOT.PNG"
                />
              </FormField>
            </Section>

            {/* LINKS */}
            <Section title="LINKS">
              <FormField label="DOTFILES_REPOSITORY" required error={errors.dotfilesUrl}>
                <TextField
                  name="dotfilesUrl"
                  type="url"
                  value={values.dotfilesUrl}
                  onChange={handleChange}
                  placeholder="GITHUB.COM/USER/DOTFILES"
                  hasError={Boolean(errors.dotfilesUrl)}
                />
              </FormField>
            </Section>

            {/* Actions */}
            <div className="flex items-center justify-end border-t-2 border-outline-variant pt-8">
              <button
                type="submit"
                disabled={submitting}
                className="border-2 border-on-primary bg-primary px-8 py-3 font-mono text-xs uppercase tracking-widest text-on-primary shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-70"
              >
                {submitting ? 'SUBMITTING...' : 'SUBMIT_RICE_'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-6">
      <h2 className="border-b-2 border-outline pb-2 font-mono text-xs uppercase tracking-widest text-on-surface-variant">
        {title}
      </h2>
      {children}
    </section>
  )
}