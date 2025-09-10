import React, { useState } from 'react';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle, Clock, Edit, Trash2, Check, X, Crown } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { UsageLimitBanner } from '../components/UsageLimitBanner';
import { UpgradeModal } from '../components/UpgradeModal';

type TransactionType = 'income' | 'expense' | 'receivable' | 'payable';

export const Finance: React.FC = () => {
  const { financialRecords, customers, addFinancialRecord, updateFinancialRecord, deleteFinancialRecord, loading } = useSupabaseData();
  const usageStatus = useUsageLimits();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('income');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    due_date: '',
    customer_id: ''
  });

  const filteredRecords = financialRecords.filter(record => {
    const matchesSearch = record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || record.type === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      description: '',
      due_date: '',
      customer_id: ''
    });
    setShowAddForm(false);
    setShowUpgradeModal(false);
    setTransactionType('income');
  };

  const handleAddTransaction = (type: TransactionType) => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    setTransactionType(type);
    
    // Set form defaults based on transaction type
    switch (type) {
      case 'income':
        setFormData(prev => ({ ...prev, type: 'income', category: 'Vendas' }));
        break;
      case 'expense':
        setFormData(prev => ({ ...prev, type: 'expense', category: 'Fornecedores' }));
        break;
      case 'receivable':
        setFormData(prev => ({ ...prev, type: 'income', category: 'A Receber' }));
        break;
      case 'payable':
        setFormData(prev => ({ ...prev, type: 'expense', category: 'A Pagar' }));
        break;
    }
    
    setShowAddForm(true);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStatusUpdate = async (recordId: string, newStatus: 'pending' | 'paid' | 'overdue') => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const updates: any = { status: newStatus };
    
    // If marking as paid, set paid_date
    if (newStatus === 'paid') {
      updates.paid_date = new Date().toISOString();
    } else {
      updates.paid_date = null;
    }

    const { error } = await updateFinancialRecord(recordId, updates);
    
    if (error) {
      showNotification('error', 'Erro ao atualizar status');
    } else {
      showNotification('success', 'Status atualizado com sucesso');
    }
    
    setEditingStatus(null);
  };

  const handleDelete = async (recordId: string) => {
    if (!usageStatus.isSubscriptionActive) {
      setShowUpgradeModal(true);
      return;
    }
    
    const { error } = await deleteFinancialRecord(recordId);
    
    if (error) {
      showNotification('error', 'Erro ao excluir transação');
    } else {
      showNotification('success', 'Transação excluída com sucesso');
    }
    
    setShowDeleteConfirm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recordData = {
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description,
      status: (transactionType === 'receivable' || transactionType === 'payable') ? 'pending' as const : 'paid' as const,
      due_date: formData.due_date,
      paid_date: (transactionType === 'income' || transactionType === 'expense') ? new Date().toISOString() : null,
      customer_id: formData.customer_id || null,
      sale_id: null
    };

    const { error } = await addFinancialRecord(recordData);
    
    if (error) {
      showNotification('error', 'Erro ao adicionar transação');
    } else {
      const typeLabels = {
        income: 'receita',
        expense: 'despesa',
        receivable: 'conta a receber',
        payable: 'conta a pagar'
      };
      showNotification('success', `${typeLabels[transactionType]} adicionada com sucesso`);
      resetForm();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  const getTransactionTypeLabel = (type: TransactionType) => {
    const labels = {
      income: 'Receita',
      expense: 'Despesa',
      receivable: 'A Receber',
      payable: 'A Pagar'
    };
    return labels[type];
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    const colors = {
      income: 'bg-green-600 hover:bg-green-700',
      expense: 'bg-red-600 hover:bg-red-700',
      receivable: 'bg-blue-600 hover:bg-blue-700',
      payable: 'bg-orange-600 hover:bg-orange-700'
    };
    return colors[type];
  };

  // Calculate financial summary
  const totalIncome = financialRecords
    .filter(r => r.type === 'income' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = financialRecords
    .filter(r => r.type === 'expense' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingIncome = financialRecords
    .filter(r => r.type === 'income' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingExpense = financialRecords
    .filter(r => r.type === 'expense' && r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Limit Banner for Non-Subscribers */}
      {!usageStatus.isSubscriptionActive && showBanner && (
        <UsageLimitBanner 
          onUpgrade={() => setShowUpgradeModal(true)}
          onDismiss={() => setShowBanner(false)}
        />
      )}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meu Financeiro</h1>
          <p className="text-gray-600">
            Controle pessoal de contas a pagar e receber
            {!usageStatus.isSubscriptionActive && (
              <span className="text-amber-600 font-medium"> (Funcionalidade Premium)</span>
            )}
          </p>
        </div>
        
        {/* Transaction Type Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleAddTransaction('income')}
            disabled={!usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
              usageStatus.isSubscriptionActive
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-1" />
            Receita
          </button>
          
          <button
            onClick={() => handleAddTransaction('expense')}
            disabled={!usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
              usageStatus.isSubscriptionActive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-1" />
            Despesa
          </button>
          
          <button
            onClick={() => handleAddTransaction('receivable')}
            disabled={!usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
              usageStatus.isSubscriptionActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-1" />
            A Receber
          </button>
          
          <button
            onClick={() => handleAddTransaction('payable')}
            disabled={!usageStatus.isSubscriptionActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
              usageStatus.isSubscriptionActive
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 mr-1" />
            A Pagar
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receitas Recebidas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Despesas Pagas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">A Receber</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingIncome)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">A Pagar</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(pendingExpense)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os tipos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
        </select>
      </div>

      {/* Financial Records Table */}
      {filteredRecords.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            record.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {record.type === 'income' ? (
                              <TrendingUp className="h-5 w-5 text-green-600" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.description}</div>
                          <div className="text-sm text-gray-500">{record.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        record.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        record.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.type === 'income' ? '+' : '-'} {formatCurrency(record.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingStatus === record.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            defaultValue={record.status}
                            onChange={(e) => handleStatusUpdate(record.id, e.target.value as any)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                            <option value="overdue">Vencido</option>
                          </select>
                          <button
                            onClick={() => setEditingStatus(null)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {getStatusIcon(record.status)}
                          <span className={`ml-2 text-sm px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(record.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingStatus(record.id)}
                          disabled={!usageStatus.isSubscriptionActive}
                          className={`p-2 rounded-lg transition-colors ${
                            usageStatus.isSubscriptionActive
                              ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={usageStatus.isSubscriptionActive ? "Alterar status" : "Disponível apenas na versão paga"}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(record.id)}
                          disabled={!usageStatus.isSubscriptionActive}
                          className={`p-2 rounded-lg transition-colors ${
                            usageStatus.isSubscriptionActive
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={usageStatus.isSubscriptionActive ? "Excluir transação" : "Disponível apenas na versão paga"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando sua primeira transação financeira'}
          </p>
          {!searchTerm && usageStatus.isSubscriptionActive && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleAddTransaction('income')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Receita
              </button>
              <button
                onClick={() => handleAddTransaction('expense')}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Despesa
              </button>
            </div>
          )}
          {!searchTerm && !usageStatus.isSubscriptionActive && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Crown className="w-4 h-4 mr-2" />
              Assinar para Usar Financeiro
            </button>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    transactionType === 'income' ? 'bg-green-100' :
                    transactionType === 'expense' ? 'bg-red-100' :
                    transactionType === 'receivable' ? 'bg-blue-100' :
                    'bg-orange-100'
                  }`}>
                    {transactionType === 'income' || transactionType === 'receivable' ? (
                      <TrendingUp className={`w-5 h-5 ${
                        transactionType === 'income' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    ) : (
                      <TrendingDown className={`w-5 h-5 ${
                        transactionType === 'expense' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nova {getTransactionTypeLabel(transactionType)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {transactionType === 'income' && 'Receita já recebida'}
                      {transactionType === 'expense' && 'Despesa já paga'}
                      {transactionType === 'receivable' && 'Valor a ser recebido'}
                      {transactionType === 'payable' && 'Valor a ser pago'}
                    </p>
                  </div>
                </div>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <Plus className="w-5 h-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        transactionType === 'income' ? 'Ex: Vendas, Serviços' :
                        transactionType === 'expense' ? 'Ex: Fornecedores, Aluguel' :
                        transactionType === 'receivable' ? 'Ex: Vendas a Prazo' :
                        'Ex: Fornecedores, Impostos'
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder={
                      transactionType === 'income' ? 'Ex: Venda de produtos para cliente X' :
                      transactionType === 'expense' ? 'Ex: Compra de materiais' :
                      transactionType === 'receivable' ? 'Ex: Venda parcelada - parcela 1/3' :
                      'Ex: Pagamento de fornecedor - vencimento 30/12'
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {transactionType === 'income' || transactionType === 'expense' ? 'Data da Transação' : 'Data de Vencimento'}
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {(transactionType === 'income' || transactionType === 'receivable') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente (opcional)</label>
                      <select
                        value={formData.customer_id}
                        onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione um cliente</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Status Info */}
                <div className={`p-3 rounded-lg border ${
                  transactionType === 'income' || transactionType === 'expense' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    transactionType === 'income' || transactionType === 'expense' 
                      ? 'text-green-800' 
                      : 'text-amber-800'
                  }`}>
                    {transactionType === 'income' && '✅ Esta receita será marcada como "Paga" automaticamente'}
                    {transactionType === 'expense' && '✅ Esta despesa será marcada como "Paga" automaticamente'}
                    {transactionType === 'receivable' && '⏳ Esta conta será marcada como "Pendente" até o recebimento'}
                    {transactionType === 'payable' && '⏳ Esta conta será marcada como "Pendente" até o pagamento'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${getTransactionTypeColor(transactionType)}`}
                  >
                    Adicionar {getTransactionTypeLabel(transactionType)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(null)}></div>
            
            <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir esta transação? Todas as informações serão perdidas permanentemente.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir Transação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Funcionalidade Premium"
        message="O controle financeiro é uma funcionalidade premium. Assine para ter acesso completo."
      />
    </div>
  );
};