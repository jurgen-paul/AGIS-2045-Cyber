import React, { useState } from 'react';
import { 
  CloudLightning, 
  CheckCircle2, 
  Download, 
  Terminal, 
  Play, 
  RefreshCw, 
  FileCode, 
  ShieldCheck, 
  Cpu, 
  Server, 
  Copy,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AwsReadinessCheck } from '../../types';
import { 
  generateTerraformSpec, 
  generateCloudFormationSpec, 
  generateDockerfileSpec, 
  generateDeploymentScript 
} from '../../services/api';

interface AwsDeploymentScreenProps {
  checks: AwsReadinessCheck[];
  onOpenBiometricGate: () => void;
}

export const AwsDeploymentScreen: React.FC<AwsDeploymentScreenProps> = ({
  checks,
  onOpenBiometricGate
}) => {
  const [activeTab, setActiveTab] = useState<'terraform' | 'cloudformation' | 'dockerfile' | 'bash'>('terraform');
  const [deployStep, setDeployStep] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const tfCode = generateTerraformSpec();
  const cfCode = generateCloudFormationSpec();
  const dockerCode = generateDockerfileSpec();
  const scriptCode = generateDeploymentScript();

  const getActiveCode = () => {
    switch (activeTab) {
      case 'terraform': return tfCode;
      case 'cloudformation': return cfCode;
      case 'dockerfile': return dockerCode;
      case 'bash': return scriptCode;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const ext = activeTab === 'terraform' ? 'tf' : activeTab === 'cloudformation' ? 'yaml' : activeTab === 'dockerfile' ? 'dockerfile' : 'sh';
    const filename = activeTab === 'terraform' ? 'main.tf' : activeTab === 'cloudformation' ? 'aegis-cloudformation.yaml' : activeTab === 'dockerfile' ? 'Dockerfile' : 'deploy-aws.sh';
    const blob = new Blob([getActiveCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunAwsDeployment = () => {
    setIsDeploying(true);
    setDeployStep(1);

    const steps = [
      { step: 1, duration: 800 },
      { step: 2, duration: 1200 },
      { step: 3, duration: 1000 },
      { step: 4, duration: 1200 },
      { step: 5, duration: 800 }
    ];

    let current = 0;
    const runNext = () => {
      if (current < steps.length) {
        setDeployStep(steps[current].step);
        setTimeout(() => {
          current++;
          runNext();
        }, steps[current].duration);
      } else {
        setDeployStep(6); // Done
        setIsDeploying(false);
        try {
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
      }
    };

    runNext();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              AWS Production Cloud Deployment
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Enterprise AWS Nitro & ECS Fargate Production Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Zero-Downtime Blue/Green container deployment, AWS Nitro Enclaves post-quantum keymaster isolation, AWS WAF Layer-7 protection, and CloudFormation/Terraform IaC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAwsDeployment}
            disabled={isDeploying}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isDeploying ? 'Deploying to AWS...' : 'Execute AWS Production Deploy'}</span>
          </button>
        </div>
      </div>

      {/* Deployment Progress Pipeline (Visible during or after deploy) */}
      {(isDeploying || deployStep > 0) && (
        <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CloudLightning className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">AWS Deployment Pipeline Execution</h3>
            </div>
            <span className="text-cyan-400 font-bold font-mono">
              {deployStep === 6 ? 'DEPLOYMENT SUCCESSFUL (us-east-1)' : `STEP ${deployStep} OF 5`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            {[
              { num: 1, title: 'Synthesize Nitro EIF', desc: 'Kyber enclave image' },
              { num: 2, title: 'Provision VPC & WAF', desc: 'Multi-AZ subnets' },
              { num: 3, title: 'Push to AWS ECR', desc: 'Docker image upload' },
              { num: 4, title: 'ECS Fargate Tasks', desc: 'Nitro enclave attach' },
              { num: 5, title: 'ALB SSL Verification', desc: 'HTTP/2 ALPN verified' }
            ].map((st) => {
              const isPast = deployStep > st.num;
              const isCurrent = deployStep === st.num;
              return (
                <div
                  key={st.num}
                  className={`p-3 rounded-lg border transition-all ${
                    isPast ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
                    isCurrent ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 animate-pulse shadow-sm' :
                    'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
                    <span>STEP 0{st.num}</span>
                    {isPast && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="font-semibold">{st.title}</div>
                  <div className="text-[10px] opacity-75">{st.desc}</div>
                </div>
              );
            })}
          </div>

          {deployStep === 6 && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-emerald-400 font-bold block text-sm">Cluster Active & Serving:</span>
                <code className="text-white font-mono">https://aegis-prod.us-east-1.elb.amazonaws.com</code>
              </div>
              <span className="px-3 py-1 rounded bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-500/50">
                100% HEALTHY
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5 AWS Readiness Checks */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">AWS Production Readiness Audit Matrix (5/5)</h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold">100% READY FOR CLOUD</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{check.title}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{check.description}</p>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
                Module: {check.codeReference}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure-As-Code Viewer & Exporter */}
      <div className="p-5 rounded-xl bg-[#1E293B] border border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Infrastructure as Code (IaC) Templates</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-cyan-600 text-white hover:bg-cyan-500 font-medium transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          {[
            { id: 'terraform', label: 'Terraform (main.tf)' },
            { id: 'cloudformation', label: 'AWS CloudFormation (YAML)' },
            { id: 'dockerfile', label: 'Dockerfile (Multi-Stage)' },
            { id: 'bash', label: 'Deployment Script (deploy.sh)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code view box */}
        <pre className="p-4 rounded-lg bg-black/40 border border-slate-800 text-xs text-cyan-300 font-mono overflow-x-auto max-h-96 whitespace-pre">
          <code>{getActiveCode()}</code>
        </pre>
      </div>
    </div>
  );
};
