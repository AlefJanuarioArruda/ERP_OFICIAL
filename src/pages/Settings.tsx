
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, CreditCard, Database, Palette, Mail, Globe, Save, Camera, Eye, EyeOff, Building, Phone, MapPin, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStripe } from '../hooks/useStripe';
import { formatPrice } from '../stripe-config';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'pt-BR'
  });

  const [companySettings, setCompanySettings] = useState({
    companyName: user?.user_metadata?.company_name || '',
    cnpj: user?.user_metadata?.company_cnpj || '',
    address: user?.user_metadata?.company_address || '',
    city: user?.user_metadata?.company_city || '',
    state: user?.user_metadata?.company_state || '',
    zipCode: user?.user_metadata?.company_zip_code || '',
    phone: user?.user_metadata?.company_phone || '',
    email: user?.user_metadata?.company_email || ''
  });

  const [notifications, setNotifications] = useState({
    email: user?.user_metadata?.notifications_email ?? true,
    push: user?.user_metadata?.notifications_push ?? true,
    lowStock: user?.user_metadata?.notifications_low_stock ?? true,
    sales: user?.user_metadata?.notifications_sales ?? true,
    financial: user?.user_metadata?.notifications_financial ?? false,
    reports: user?.user_metadata?.notifications_reports ?? true
  });

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'company', name: 'Empresa', icon: Building },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'billing', name: 'Faturamento', icon: CreditCard },
    { id: 'integrations', name: 'Integrações', icon: Globe }
  ];

  const handleSave = () => {
    if (activeTab === 'profile') {
      handleProfileSave();
    } else if (activeTab === 'company') {
      handleCompanySave();
    } else if (activeTab === 'notifications') {
      handleNotificationsSave();
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleProfileSave = async () => {
    setLoading(true);
    
    try {
      const updates: any = {};
      
      // Update name if changed
      if (profileData.name !== (user?.user_metadata?.full_name || '')) {
        updates.full_name = profileData.name;
      }
      
      // Update email if changed
      if (profileData.email !== user?.email) {
        updates.email = profileData.email;
      }
      
      if (Object.keys(updates).length > 0) {
        const result = await updateProfile(updates);
        if (result.success) {
          showNotification('success', 'Perfil atualizado com sucesso!');
        } else {
          showNotification('error', result.error || 'Erro ao atualizar perfil');
        }
      } else {
        showNotification('success', 'Configurações salvas!');
      }
    } catch (error) {
      showNotification('error', 'Erro inesperado ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySave = async () => {
    setLoading(true);
    
    try {
      // For now, we'll save company settings to user metadata
      // In a real application, you might want a separate company table
      const updates = {
        company_name: companySettings.companyName,
        company_cnpj: companySettings.cnpj,
        company_address: companySettings.address,
        company_city: companySettings.city,
        company_state: companySettings.state,
        company_zip_code: companySettings.zipCode,
        company_phone: companySettings.phone,
        company_email: companySettings.email
      };
      
      const result = await updateProfile(updates);
      if (result.success) {
        showNotification('success', 'Informações da empresa atualizadas com sucesso!');
      } else {
        showNotification('error', result.error || 'Erro ao atualizar informações da empresa');
      }
    } catch (error) {
      showNotification('error', 'Erro inesperado ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    setLoading(true);
    
    try {
      const updates = {
        notifications_email: notifications.email,
        notifications_push: notifications.push,
        notifications_low_stock: notifications.lowStock,
        notifications_sales: notifications.sales,
        notifications_financial: notifications.financial,
        notifications_reports: notifications.reports
      };
      
      const result = await updateProfile(updates);
      if (result.success) {
        showNotification('success', 'Preferências de notificação atualizadas com sucesso!');
      } else {
        showNotification('error', result.error || 'Erro ao atualizar preferências');
      }
    } catch (error) {
      showNotification('error', 'Erro inesperado ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfilePhoto(file);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    try {
      setLoading(true)
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Imagem muito grande. Máximo 5MB.')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Por favor, selecione uma imagem válida.')
        return
      }
      
      // Ensure user is logged in
      if (!user) {
        showNotification('error', 'Usuário não autenticado.')
        return
      }

      const fileExtension = file.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${fileExtension}`

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase Storage upload error:', error)
        showNotification('error', `Erro ao fazer upload da imagem: ${error.message}`)
        return
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!publicUrlData || !publicUrlData.publicUrl) {
        showNotification('error', 'Erro ao obter URL pública da imagem.')
        return
      }

      // Update user profile with new avatar URL
      const updateResult = await updateProfile({ avatar_url: publicUrlData.publicUrl })

      if (updateResult.success) {
        showNotification('success', 'Foto de perfil atualizada com sucesso!')
      } else {
        showNotification('error', updateResult.error || 'Erro ao atualizar perfil com nova foto.')
      }
      
    } catch (error) {
      console.error('Profile photo upload error:', error)
      showNotification('error', 'Erro inesperado ao atualizar foto')
    } finally {
      setLoading(false)
    }
  };

  const handleCompanyLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock logo upload
      console.log('Uploading logo:', file.name);
      alert('Logotipo da empresa atualizado com sucesso!');
    }
  };

  const validatePasswordChange = () => {
    if (!profileData.currentPassword) {
      alert('Digite sua senha atual');
      return false;
    }
    if (!profileData.newPassword) {
      alert('Digite a nova senha');
      return false;
    }
    if (profileData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert('As senhas não coincidem');
      return false;
    }
    return true;
  };

  const handlePasswordChange = () => {
    if (validatePasswordChange()) {
      handlePasswordUpdate();
    }
  };

  const handlePasswordUpdate = async () => {
    setLoading(true);
    
    try {
      const result = await updateProfile({ 
        password: profileData.newPassword,
        currentPassword: profileData.currentPassword 
      });
      
      if (result.success) {
        showNotification('success', 'Senha alterada com sucesso!');
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification('error', result.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      showNotification('error', 'Erro inesperado ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-3 ${
                      activeTab === tab.id ? 'text-blue-700' : 'text-gray-400'
                    }`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Perfil</h3>
                  
                  {/* Profile Photo Section */}
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                        {user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt={user?.user_metadata?.full_name || 'Usuário'}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-blue-600" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                        <Camera className="w-3 h-3 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-medium text-gray-900">Foto de Perfil</h4>
                      <p className="text-sm text-gray-600">Clique no ícone da câmera para alterar</p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Language Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <select
                      value={profileData.language}
                      onChange={(e) => setProfileData({...profileData, language: e.target.value})}
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>

                  {/* Password Change Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Alterar Senha</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={profileData.currentPassword}
                            onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite sua senha atual"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={profileData.newPassword}
                            onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={profileData.confirmPassword}
                            onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Confirme a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Alterar Senha
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h3>
                  
                  {/* Company Logo Section */}
                  <div className="flex items-center mb-6">
                    <div className="relative">
                
                   
                    </div>
                    
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                      <input
                        type="text"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                      <input
                        type="text"
                        value={companySettings.cnpj}
                        onChange={(e) => setCompanySettings({...companySettings, cnpj: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                      <input
                        type="text"
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Rua, número, bairro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={companySettings.city}
                        onChange={(e) => setCompanySettings({...companySettings, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input
                        type="text"
                        value={companySettings.state}
                        onChange={(e) => setCompanySettings({...companySettings, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="SP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <input
                        type="text"
                        value={companySettings.zipCode}
                        onChange={(e) => setCompanySettings({...companySettings, zipCode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                      <input
                        type="tel"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(11) 0000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
        {activeTab !== 'integrations' && activeTab !== 'billing' && (
  <div className="flex justify-end pt-6 border-t border-gray-200">
    <button
      onClick={handleSave}
      disabled={loading}
      className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Salvando...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </>
      )}
    </button>
  </div>
)}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Preferências de Notificação</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações por Email</h4>
                      <p className="text-sm text-gray-600">Receba alertas importantes por email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Notificações Push</h4>
                      <p className="text-sm text-gray-600">Receba notificações no navegador</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.push}
                        onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Alertas de Estoque Baixo</h4>
                      <p className="text-sm text-gray-600">Seja notificado quando produtos estiverem com estoque baixo</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.lowStock}
                        onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Relatórios de Vendas</h4>
                      <p className="text-sm text-gray-600">Receba resumos semanais de vendas</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.sales}
                        onChange={(e) => setNotifications({...notifications, sales: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Alertas Financeiros</h4>
                      <p className="text-sm text-gray-600">Notificações sobre vencimentos e pagamentos</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.financial}
                        onChange={(e) => setNotifications({...notifications, financial: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Relatórios Automáticos</h4>
                      <p className="text-sm text-gray-600">Receba relatórios mensais automaticamente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.reports}
                        onChange={(e) => setNotifications({...notifications, reports: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Plano e Faturamento</h3>
                
                <BillingSection />
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Integrações</h3>
                
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Integrações em Breve</h4>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    Estamos trabalhando para trazer integrações incríveis que vão conectar seu ERP Smart 
                    com as principais ferramentas do mercado.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                    <h5 className="font-semibold text-gray-900 mb-3">🚀 Próximas Integrações:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Mercado Livre & OLX
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        WhatsApp Business
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Correios & Transportadoras
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        Bancos & PIX
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Nota Fiscal Eletrônica
                      </div>
                      <div className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                        Google Analytics
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Quer sugerir uma integração? Entre em contato conosco!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Billing Section Component
const BillingSection: React.FC = () => {
  const { subscription, getActiveSubscription, loading, createCheckoutSession } = useStripe();
  const { product, isActive } = getActiveSubscription();
  const [loadingManageSubscription, setLoadingManageSubscription] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Carregando informações de faturamento...</span>
      </div>
    );
  }

  if (!isActive || !product) {
    return (
      <div className="text-center py-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum Plano Ativo</h4>
          <p className="text-gray-600 mb-4">
            Você não possui um plano ativo no momento. Escolha um plano para começar a usar todas as funcionalidades.
          </p>
          <button
            onClick={() => {
              // Navigate to pricing page using the parent component's navigation
              const event = new CustomEvent('navigate-to-pricing');
              window.dispatchEvent(event);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            !!Clique em Planos no Menu para ver os Planos Disponíveis!!
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'trialing':
        return 'Período de Teste';
      case 'past_due':
        return 'Pagamento Atrasado';
      case 'canceled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleManageSubscription = async () => {
    if (!product) return;
    
    setLoadingManageSubscription(true);
    
    try {
      const result = await createCheckoutSession(product.priceId, 'subscription');
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        alert(result.error || 'Erro ao abrir gerenciamento de assinatura');
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      alert('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingManageSubscription(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatPrice(product.price)} / {product.interval === 'year' ? 'ano' : 'mês'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription?.subscription_status || '')}`}>
            {getStatusLabel(subscription?.subscription_status || '')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subscription?.current_period_end && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Próxima Renovação</h4>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
            <p className="text-sm text-gray-600">{formatDate(subscription.current_period_end)}</p>
            {subscription.cancel_at_period_end && (
              <p className="text-sm text-red-600 mt-1">Cancelamento agendado</p>
            )}
          </div>
        )}
        
        {subscription?.payment_method_brand && subscription?.payment_method_last4 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Método de Pagamento</h4>
            <p className="text-gray-900">•••• •••• •••• {subscription.payment_method_last4}</p>
            <p className="text-sm text-gray-600 capitalize">{subscription.payment_method_brand}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            navigate('/pricing');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Alterar Plano
        </button>
        <button 
          onClick={handleManageSubscription}
          disabled={loadingManageSubscription || !product}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingManageSubscription ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Carregando...
            </div>
          ) : (
            'Gerenciar Assinatura'
          )}
        </button>
      </div>
    </>
  );
};