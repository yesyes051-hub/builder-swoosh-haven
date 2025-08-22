import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/fetch';
import { useAuth } from '@/contexts/AuthContext';
import { NetworkDiagnostics, DiagnosticResult } from '@/lib/diagnostics';

export default function ApiTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [diagnosticsResult, setDiagnosticsResult] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const testPing = async () => {
    setLoading(true);
    try {
      console.log('Testing ping endpoint...');
      const result = await apiRequest('/api/ping');
      console.log('Ping result:', result);
      setTestResult(`✅ Ping success: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Ping error:', error);
      setTestResult(`❌ Ping failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testDashboard = async () => {
    if (!token) {
      setTestResult('❌ No token available');
      return;
    }

    setLoading(true);
    try {
      console.log('Testing dashboard endpoint...');
      const result = await apiRequest('/api/dashboard/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Dashboard result:', result);
      setTestResult(`✅ Dashboard success: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Dashboard error:', error);
      setTestResult(`❌ Dashboard failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testFetchDirect = async () => {
    setLoading(true);
    try {
      console.log('Testing direct fetch with relative URL...');
      const response = await fetch('/api/ping');
      const result = await response.json();
      console.log('Direct fetch result:', result);
      setTestResult(`✅ Direct fetch success: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error('Direct fetch error:', error);
      setTestResult(`❌ Direct fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('Running network diagnostics...');
      const results = await NetworkDiagnostics.runAll();
      console.log('Diagnostics results:', results);
      setDiagnosticsResult(results);
      setTestResult('✅ Diagnostics completed - see results below');
    } catch (error) {
      console.error('Diagnostics error:', error);
      setTestResult(`❌ Diagnostics failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testPing} disabled={loading}>
            Test Ping
          </Button>
          <Button onClick={testDashboard} disabled={loading}>
            Test Dashboard
          </Button>
          <Button onClick={testFetchDirect} disabled={loading}>
            Test Direct Fetch
          </Button>
          <Button onClick={runDiagnostics} disabled={loading} variant="outline">
            Run Diagnostics
          </Button>
        </div>
        
        {testResult && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Test Result:</h4>
            <pre className="text-sm whitespace-pre-wrap break-words">
              {testResult}
            </pre>
          </div>
        )}

        {diagnosticsResult.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Diagnostic Results:</h4>
            {diagnosticsResult.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.test}</span>
                  <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? '✅' : '❌'} {result.duration ? `(${Math.round(result.duration)}ms)` : ''}
                  </span>
                </div>
                <p className="text-sm mt-1">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                    <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>Current Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'development' ? 'relative URLs' : 'not set')}</p>
          <p><strong>Has Token:</strong> {token ? 'Yes' : 'No'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
