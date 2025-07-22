import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import storage from '@/lib/storage';
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  Trash2, 
  RefreshCw,
  HardDrive,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const DataBackupManager = () => {
  const [storageStats, setStorageStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = () => {
    const stats = storage.getStats();
    setStorageStats(stats);
  };

  const handleExportData = () => {
    try {
      setIsLoading(true);
      const exportData = storage.exportData();
      
      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `autocare-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Data Exported Successfully",
        description: "Your AutoCare data has been downloaded as a backup file.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        const success = storage.importData(importData);
        
        if (success) {
          toast({
            title: "Data Imported Successfully",
            description: "Your backup has been restored. Please refresh the page.",
            duration: 5000,
          });
          loadStorageStats();
          
          // Suggest page refresh
          setTimeout(() => {
            if (window.confirm('Data imported successfully! Refresh the page to see your restored data?')) {
              window.location.reload();
            }
          }, 2000);
        } else {
          throw new Error('Import failed');
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid backup file or import error. Please check your file.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
        event.target.value = ''; // Reset file input
      }
    };
    
    reader.readAsText(file);
  };

  const handleCleanupData = () => {
    if (window.confirm('This will remove old backup files and free up space. Continue?')) {
      try {
        setIsLoading(true);
        storage.cleanup();
        loadStorageStats();
        
        toast({
          title: "Cleanup Complete",
          description: "Old backup files have been removed to free up space.",
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: "Cleanup Failed",
          description: "Failed to cleanup old data. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete ALL your AutoCare data! Are you sure?')) {
      if (window.confirm('This action cannot be undone. Type "DELETE" to confirm:') && 
          window.prompt('Type DELETE to confirm:') === 'DELETE') {
        try {
          setIsLoading(true);
          storage.clearAll();
          loadStorageStats();
          
          toast({
            title: "All Data Cleared",
            description: "All AutoCare data has been permanently deleted.",
            variant: "destructive",
            duration: 5000,
          });
          
          // Redirect to login after clearing data
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } catch (error) {
          toast({
            title: "Clear Failed",
            description: "Failed to clear data. Please try again.",
            variant: "destructive",
            duration: 3000,
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const getStorageHealthStatus = () => {
    if (!storageStats) return { status: 'unknown', color: 'secondary' };
    
    const usagePercentage = (storageStats.totalSize / (5 * 1024 * 1024)) * 100; // Assuming 5MB limit
    
    if (usagePercentage < 50) {
      return { status: 'healthy', color: 'success', icon: CheckCircle };
    } else if (usagePercentage < 80) {
      return { status: 'warning', color: 'warning', icon: AlertCircle };
    } else {
      return { status: 'critical', color: 'destructive', icon: AlertCircle };
    }
  };

  const health = getStorageHealthStatus();
  const HealthIcon = health.icon || Database;

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Storage Overview
          </CardTitle>
          <CardDescription>
            Monitor and manage your AutoCare data storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storageStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm font-medium">Storage Used</span>
                </div>
                <div className="text-2xl font-bold">{storageStats.formattedSize}</div>
                <div className="text-sm text-muted-foreground">
                  {storageStats.itemCount} items stored
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HealthIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Storage Health</span>
                </div>
                <Badge variant={health.color} className="text-sm">
                  {health.status.toUpperCase()}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  System running normally
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Last Backup</span>
                </div>
                <div className="text-sm">
                  {storageStats.metadata.lastCleanup 
                    ? new Date(storageStats.metadata.lastCleanup).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadStorageStats}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Backup & Recovery
          </CardTitle>
          <CardDescription>
            Export your data for safekeeping or import from a previous backup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <div className="space-y-3">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a complete backup of all your AutoCare data including vehicles, 
                service requests, and settings.
              </p>
              <Button 
                onClick={handleExportData}
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>

            {/* Import Data */}
            <div className="space-y-3">
              <h4 className="font-medium">Import Data</h4>
              <p className="text-sm text-muted-foreground">
                Restore your data from a previously exported backup file. 
                This will replace all current data.
              </p>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  disabled={isLoading}
                  className="hidden"
                  id="import-file"
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('import-file').click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Maintain and optimize your data storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cleanup */}
            <div className="space-y-3">
              <h4 className="font-medium">Cleanup Storage</h4>
              <p className="text-sm text-muted-foreground">
                Remove old backup files and temporary data to free up space.
              </p>
              <Button 
                variant="outline"
                onClick={handleCleanupData}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? 'Cleaning...' : 'Cleanup Storage'}
              </Button>
            </div>

            {/* Clear All Data */}
            <div className="space-y-3">
              <h4 className="font-medium text-destructive">Danger Zone</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your AutoCare data. This action cannot be undone.
              </p>
              <Button 
                variant="destructive"
                onClick={handleClearAllData}
                disabled={isLoading}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Clearing...' : 'Clear All Data'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <h5 className="font-medium">Regular Backups</h5>
                <p className="text-sm text-muted-foreground">
                  Export your data regularly, especially before major updates or when adding important information.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h5 className="font-medium">Automatic Protection</h5>
                <p className="text-sm text-muted-foreground">
                  Your data is automatically backed up locally and validated to prevent corruption.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
              <div>
                <h5 className="font-medium">Cross-Device Sync</h5>
                <p className="text-sm text-muted-foreground">
                  Use the export/import feature to sync your data across different devices.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataBackupManager;