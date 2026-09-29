import { useState } from 'react'
import { ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

function AuthFrame({ eyebrow, title, subtitle, children, alternate }) {
  return <main className="auth-page"><section className="auth-image"><img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1400&q=85" alt="Everyday sneakers" /><div><span className="eyebrow">MGEARS / GOOD SHOES, GOOD STORIES</span><h2>Some things are<br />better the <em>second time.</em></h2></div></section><section className="auth-content"><div className="auth-box"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p>{children}<div className="auth-alternate">{alternate}</div><div className="auth-safe"><LockKeyhole size={15} /> Your details stay with us.</div></div></section></main>
}
export function LoginPage() {
  const { login } = useAuth()
  const { notify } = useUI()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError('')
    const form = new FormData(event.currentTarget)
    try { await login(form.get('email'), form.get('password')); notify('Welcome back.'); navigate('/account') } catch (problem) { setError(problem.message) } finally { setLoading(false) }
  }
  return <AuthFrame eyebrow="WELCOME BACK" title="Good to see you." subtitle="Log in to pick up where you left off." alternate={<>New to MGEARS? <Link to="/register">Create an account</Link></>}><form className="auth-form" onSubmit={submit}><label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></label><div className="auth-form-row"><label className="check-label"><input type="checkbox" /> Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>{error && <p className="validation-message">{error}</p>}<button className="button button-dark full-button" disabled={loading}>{loading ? 'Logging in…' : 'Log in'} <ArrowRight size={16} /></button><p className="demo-note">Demo: use any email address and password.</p></form></AuthFrame>
}
export function RegisterPage() {
  const { register } = useAuth()
  const { notify } = useUI()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setError('')
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirm')) { setError('Your passwords don’t match.'); return }
    try { await register(form.get('name'), form.get('email'), form.get('password'), form.get('phone')); notify('Your account is ready.'); navigate('/account') } catch (problem) { setError(problem.message) }
  }
  return <AuthFrame eyebrow="JOIN THE GOOD-SHOE CLUB" title="Let’s get acquainted." subtitle="A few details and you’re on your way." alternate={<>Already have an account? <Link to="/login">Log in</Link></>}><form className="auth-form" onSubmit={submit}><label>Your name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="+92" /></label><label>Password<input name="password" type="password" autoComplete="new-password" minLength="6" required /></label><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength="6" required /></label>{error && <p className="validation-message">{error}</p>}<button className="button button-dark full-button">Create my account <ArrowRight size={16} /></button></form></AuthFrame>
}
export function ForgotPasswordPage() {
  const { notify } = useUI()
  const [sent, setSent] = useState(false)
  return <AuthFrame eyebrow="ACCOUNT SUPPORT" title={sent ? 'Check your inbox.' : 'Forgot your password?'} subtitle={sent ? 'If there’s an account for that email, we’ve sent a reset link.' : 'Enter your email and we’ll show you the next step.'} alternate={<>Remembered it? <Link to="/login">Back to log in</Link></>}><form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSent(true); notify('Password reset instructions are ready (demo).') }}><label>Email address<input type="email" required autoComplete="email" /></label><button className="button button-dark full-button">{sent ? 'Send again' : 'Send reset instructions'} <ArrowRight size={16} /></button><Link to="/reset-password" className="reset-demo-link">Continue to reset password demo</Link></form></AuthFrame>
}
export function ResetPasswordPage() {
  const { notify } = useUI()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  return <AuthFrame eyebrow="ACCOUNT SUPPORT" title="Choose a new password." subtitle="Make it something only you know." alternate={<>Need help? <Link to="/contact">Get in touch</Link></>}><form className="auth-form" onSubmit={(event) => { event.preventDefault(); if (event.currentTarget.password.value !== event.currentTarget.confirm.value) { setError('Your passwords don’t match.'); return } setError(''); notify('Your password has been updated (demo).'); navigate('/login') }}><label>New password<input name="password" type="password" minLength="6" required /></label><label>Confirm new password<input name="confirm" type="password" minLength="6" required /></label>{error && <p className="validation-message">{error}</p>}<button className="button button-dark full-button">Update password <Check size={16} /></button></form></AuthFrame>
}
