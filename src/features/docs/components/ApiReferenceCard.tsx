import React, { useState } from 'react';
import { Lock, Copy, Check } from 'lucide-react';
import type { ApiEndpointSpec } from '../data/docsContent';
import { CodeBlock } from './CodeBlock';

interface ApiReferenceCardProps {
  spec: ApiEndpointSpec;
}

const METHOD_STYLES: Record<ApiEndpointSpec['method'], { badge: string; border: string }> = {
  GET: { badge: 'bg-emerald-100 text-emerald-900 border-emerald-300', border: 'border-l-emerald-600' },
  POST: { badge: 'bg-blue-100 text-blue-900 border-blue-300', border: 'border-l-blue-600' },
  PUT: { badge: 'bg-amber-100 text-amber-900 border-amber-300', border: 'border-l-amber-600' },
  DELETE: { badge: 'bg-rose-100 text-rose-900 border-rose-300', border: 'border-l-rose-600' },
};

export const ApiReferenceCard: React.FC<ApiReferenceCardProps> = ({ spec }) => {
  const [copied, setCopied] = useState(false);
  const style = METHOD_STYLES[spec.method] || METHOD_STYLES.GET;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(spec.endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`my-6 rounded-xl border border-slate-200 border-l-4 ${style.border} bg-white shadow-xs overflow-hidden`}>
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${style.badge}`}>
            {spec.method}
          </span>
          <code className="text-xs sm:text-sm font-mono font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
            {spec.endpoint}
          </code>
          <button
            type="button"
            onClick={handleCopyEndpoint}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Copy endpoint"
            aria-label="Copy endpoint URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {spec.authRequired && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>JWT Bearer</span>
            </span>
          )}
          {spec.permission && (
            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-300">
              {spec.permission}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{spec.title}</h3>
          <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-prose">{spec.description}</p>
        </div>

        {/* Parameters Table if present */}
        {spec.parameters && spec.parameters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Parameters</h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Field</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Required</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {spec.parameters.map((param) => (
                    <tr key={param.name} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">{param.name}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 text-xs">{param.type}</td>
                      <td className="py-3 px-4">
                        {param.required ? (
                          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request Body if present */}
        {spec.requestBody && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Request Payload</h4>
            <CodeBlock code={spec.requestBody} language="json" filename="Request Body (application/json)" />
          </div>
        )}

        {/* Response Body */}
        {spec.responseBody && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Response JSON (200 OK)</h4>
            <CodeBlock code={spec.responseBody} language="json" filename="Response Payload" />
          </div>
        )}
      </div>
    </div>
  );
};
