// reset-password.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const [password, setPassword] = useState('')

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      alert('Senha alterada com sucesso!')
      window.location.href = '/login'
    }
  }

  return (
    <div>
      <h1>Redefinir Senha</h1>
      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={updatePassword}>Salvar</button>
    </div>
  )
}
