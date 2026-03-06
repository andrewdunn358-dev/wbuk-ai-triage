import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'message/rfc822'
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function EvidenceUpload({ sessionToken, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-blue-500" />;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 50MB.`);
        return false;
      }
      // Check extension instead of MIME type for better compatibility
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.csv', '.eml', '.msg'];
      if (!allowedExtensions.includes(ext)) {
        toast.error(`${file.name} is not a supported file type.`);
        return false;
      }
      return true;
    });

    setFiles(prev => [
      ...prev,
      ...validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        uploaded: null
      }))
    ]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const results = [];

    for (const fileItem of files) {
      if (fileItem.status === 'uploaded') continue;

      setUploadProgress(prev => ({ ...prev, [fileItem.id]: 0 }));
      
      try {
        const formData = new FormData();
        formData.append('file', fileItem.file);
        formData.append('session_token', sessionToken);

        const response = await fetch(`${API_URL}/api/evidence/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Upload failed');
        }

        const data = await response.json();
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'uploaded', uploaded: data }
            : f
        ));
        
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: 100 }));
        results.push(data);
        
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', error: error.message }
            : f
        ));
        toast.error(`Failed to upload ${fileItem.file.name}: ${error.message}`);
      }
    }

    setUploading(false);
    
    if (results.length > 0) {
      toast.success(`${results.length} file(s) uploaded successfully`);
      if (onUploadComplete) {
        onUploadComplete(results);
      }
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadedCount = files.filter(f => f.status === 'uploaded').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Upload className="h-5 w-5 text-teal-600" />
          Evidence Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Notice */}
        <div className="flex items-start gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-teal-800">Metadata Protection</p>
            <p className="text-teal-700">
              All uploaded files have identifying metadata automatically removed to protect your anonymity.
            </p>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Before uploading:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Remove any visible personal information if possible</li>
              <li>Be aware that document content itself may be identifying</li>
              <li>Only upload evidence relevant to your disclosure</li>
            </ul>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input').click()}
          data-testid="dropzone"
        >
          <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 mb-1">
            Drag and drop files here, or click to select
          </p>
          <p className="text-sm text-slate-500">
            PDF, Word, Excel, Images, Text files (max 50MB each)
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx,.csv,.eml,.msg"
            data-testid="file-input"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-slate-700">
                Files ({uploadedCount} uploaded, {pendingCount} pending)
              </p>
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="bg-teal-600 hover:bg-teal-700"
                  data-testid="upload-button"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {pendingCount} file(s)
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  data-testid={`file-item-${fileItem.id}`}
                >
                  {getFileIcon(fileItem.file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{formatSize(fileItem.file.size)}</span>
                      {fileItem.status === 'pending' && (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                      {fileItem.status === 'uploaded' && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {fileItem.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                      )}
                    </div>
                    {uploading && uploadProgress[fileItem.id] !== undefined && uploadProgress[fileItem.id] < 100 && (
                      <Progress value={uploadProgress[fileItem.id]} className="h-1 mt-1" />
                    )}
                  </div>
                  {fileItem.status !== 'uploaded' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(fileItem.id)}
                      data-testid={`remove-file-${fileItem.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
