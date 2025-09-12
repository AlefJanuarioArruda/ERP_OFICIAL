import React from 'react';
import { Brain, AlertTriangle, TrendingUp, Lightbulb, FileText, X } from 'lucide-react';
import { AIInsight } from '../types';

interface AIInsightCardProps {
  insight: AIInsight;
  onMarkAsRead: (id: string) => void;
}

const iconMap = {
  prediction: TrendingUp,
  recommendation: Lightbulb,
  alert: AlertTriangle,
  summary: FileText
};

const colorMap = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-blue-200 bg-blue-50'
};

const iconColorMap = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-blue-600'
};

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, onMarkAsRead }) => {
  const Icon = iconMap[insight.type];

  return (
    <div className={`
      relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
      ${colorMap[insight.priority]}
      ${insight.isRead ? 'opacity-75' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${iconColorMap[insight.priority]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <Brain className="w-3 h-3 mr-1" />
                IA Insight
              </span>
              <span>Prioridade: {insight.priority}</span>
              <span>{insight.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};