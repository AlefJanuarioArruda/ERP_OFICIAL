import React, { useState } from 'react';
import { Calculator, Plus, Trash2, DollarSign, TrendingUp, Percent, Package } from 'lucide-react';

interface CostItem {
  id: string;
  name: string;
  value: number;
}

export const CostSimulator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [newCostName, setNewCostName] = useState('');
  const [newCostValue, setNewCostValue] = useState('');

  const addCost = () => {
    if (newCostName && newCostValue) {
      const newCost: CostItem = {
        id: Date.now().toString(),
        name: newCostName,
        value: parseFloat(newCostValue)
      };
      setCosts([...costs, newCost]);
      setNewCostName('');
      setNewCostValue('');
    }
  };

  const removeCost = (id: string) => {
    setCosts(costs.filter(cost => cost.id !== id));
  };

  const totalCost = costs.reduce((sum, cost) => sum + cost.value, 0);
  const sellingPriceNum = parseFloat(sellingPrice) || 0;
  const profit = sellingPriceNum - totalCost;
  const profitMargin = sellingPriceNum > 0 ? (profit / sellingPriceNum) * 100 : 0;
  const markup = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const clearSimulation = () => {
    setProductName('');
    setSellingPrice('');
    setCosts([]);
    setNewCostName('');
    setNewCostValue('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Simulador de Custo</h1>
        <p className="text-gray-600">Simule e calcule custos, margem de lucro e preço de venda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Product Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Informações do Produto</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto (Opcional)
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Camiseta Personalizada"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço de Venda
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add Costs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Adicionar Custos</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição do Custo
                </label>
                <input
                  type="text"
                  value={newCostName}
                  onChange={(e) => setNewCostName(e.target.value)}
                  placeholder="Ex: Matéria Prima, Mão de Obra"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addCost()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    step="0.01"
                    value={newCostValue}
                    onChange={(e) => setNewCostValue(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addCost()}
                  />
                </div>
              </div>

              <button
                onClick={addCost}
                disabled={!newCostName || !newCostValue}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Custo
              </button>
            </div>

            {/* Cost List */}
            {costs.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Custos Adicionados:</h3>
                {costs.map((cost) => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cost.name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(cost.value)}</p>
                    </div>
                    <button
                      onClick={() => removeCost(cost.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Resultados da Simulação</h2>
              {(productName || sellingPrice || costs.length > 0) && (
                <button
                  onClick={clearSimulation}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar
                </button>
              )}
            </div>

            {productName && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-1">Produto</p>
                <p className="text-lg font-semibold text-blue-900">{productName}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Total Cost */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                      <Calculator className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-red-600 font-medium">Custo Total</p>
                      <p className="text-xs text-red-500">{costs.length} itens</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(totalCost)}</p>
                </div>
              </div>

              {/* Selling Price */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Preço de Venda</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(sellingPriceNum)}</p>
                </div>
              </div>

              {/* Profit */}
              <div className={`p-4 border rounded-lg ${
                profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      profit >= 0 ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      <TrendingUp className={`w-5 h-5 ${
                        profit >= 0 ? 'text-blue-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        profit >= 0 ? 'text-blue-600' : 'text-amber-600'
                      }`}>
                        {profit >= 0 ? 'Lucro' : 'Prejuízo'}
                      </p>
                      <p className={`text-xs ${
                        profit >= 0 ? 'text-blue-500' : 'text-amber-500'
                      }`}>
                        {profit >= 0 ? 'Por unidade' : 'Ajuste o preço'}
                      </p>
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${
                    profit >= 0 ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {formatCurrency(Math.abs(profit))}
                  </p>
                </div>
              </div>

              {/* Profit Margin */}
              {sellingPriceNum > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Percent className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Margem de Lucro</p>
                        <p className="text-xs text-purple-500">Sobre o preço de venda</p>
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${
                      profitMargin >= 30 ? 'text-green-600' :
                      profitMargin >= 15 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {/* Markup */}
              {totalCost > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                        <Percent className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">Markup</p>
                        <p className="text-xs text-indigo-500">Sobre o custo total</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">
                      {markup.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {sellingPriceNum > 0 && totalCost > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Recomendações:</p>
                {profitMargin < 15 && (
                  <p className="text-sm text-amber-700 mb-1">
                    ⚠️ Margem de lucro baixa. Considere aumentar o preço de venda ou reduzir custos.
                  </p>
                )}
                {profitMargin >= 15 && profitMargin < 30 && (
                  <p className="text-sm text-blue-700 mb-1">
                    ℹ️ Margem de lucro adequada. Monitore seus custos regularmente.
                  </p>
                )}
                {profitMargin >= 30 && (
                  <p className="text-sm text-green-700 mb-1">
                    ✓ Excelente margem de lucro! Continue monitorando o mercado.
                  </p>
                )}
                {profit < 0 && (
                  <p className="text-sm text-red-700 mb-1">
                    ❌ Preço de venda abaixo do custo! Ajuste imediatamente.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
