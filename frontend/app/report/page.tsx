'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Flame,
  HeartPulse,
  Loader2,
  MapPin,
  XCircle,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { saveIncidentOffline } from '@/lib/offline';

type FormErrors = {
  incidentType?: string;
  description?: string;
  location?: string;
};

const incidentTypes = [
  { value: 'accident', label: 'Accident', icon: Car },
  { value: 'fire', label: 'Fire', icon: Flame },
  { value: 'medical', label: 'Medical', icon: HeartPulse },
  { value: 'disaster', label: 'Disaster', icon: AlertTriangle },
];

export default function ReportPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [statusMessage, setStatusMessage] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const getLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    clearFieldError('location');

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable location access to continue.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable. Try again shortly.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Try again.';
        }
        setLocationError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setStatusMessage(null);

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!incidentType) {
      nextErrors.incidentType = 'Select an incident type.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Add a brief description of the emergency.';
    }

    if (!location) {
      nextErrors.location = 'Capture your current location.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const offlinePayload = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      incidentType,
      description: description.trim(),
      latitude: location?.lat ?? 0,
      longitude: location?.lng ?? 0,
      reportedAt: new Date().toISOString(),
      status: 'pending',
      photoDataUrl: photoPreview ?? undefined,
    };

    const saveOffline = async () => {
      await saveIncidentOffline(offlinePayload);

      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-incidents');
      }

      setStatusMessage({
        type: 'success',
        message: 'No internet. Report saved offline and will sync automatically.',
      });
      setIncidentType('');
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveOffline();
        return;
      }

      const formData = new FormData();
      formData.append('incidentType', incidentType);
      formData.append('description', description.trim());
      formData.append('latitude', String(location?.lat ?? ''));
      formData.append('longitude', String(location?.lng ?? ''));

      if (photoFile) {
        formData.append('image', photoFile);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.post(`${getApiBaseUrl()}/incidents`, formData, {
        headers,
        withCredentials: true,
      });

      setStatusMessage({
        type: 'success',
        message: 'Emergency report submitted successfully. Responders have been notified.',
      });
      setIncidentType('');
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      const isNetworkError = axios.isAxiosError(error) && !error.response;
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

      if (isNetworkError || isOffline) {
        try {
          await saveOffline();
        } catch (saveError) {
          console.error('Failed to save offline report:', saveError);
          setStatusMessage({
            type: 'error',
            message: 'Unable to save the report offline. Please try again.',
          });
        }
      } else {
        setStatusMessage({
          type: 'error',
          message: 'Unable to submit the report. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(incidentType && description.trim() && location);

  return (
    <DashboardLayout 
      title="Report Emergency" 
      description="Provide quick, accurate details so responders can act fast."
    >
      <div className="relative">
        <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <Card className="border-rose-100/70 bg-white/90 shadow-xl backdrop-blur">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-200">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-900">ResQNet Emergency Report</CardTitle>
                    <CardDescription className="text-slate-600">
                      Provide quick, accurate details so responders can act fast.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {statusMessage && (
                  <Alert
                    variant={statusMessage.type === 'error' ? 'destructive' : 'default'}
                    className={
                      statusMessage.type === 'error'
                        ? 'border-rose-200 bg-rose-50 text-rose-900'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    }
                  >
                    {statusMessage.type === 'error' ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {statusMessage.type === 'error' ? 'Submission Failed' : 'Report Sent'}
                    </AlertTitle>
                    <AlertDescription>{statusMessage.message}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="incidentType">Incident Type *</Label>
                      <Select
                        value={incidentType}
                        onValueChange={(value) => {
                          setIncidentType(value);
                          clearFieldError('incidentType');
                          setStatusMessage(null);
                        }}
                      >
                        <SelectTrigger id="incidentType" className="w-full bg-white">
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                        <SelectContent>
                          {incidentTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-rose-600" />
                                  <span>{type.label}</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {errors.incidentType && (
                        <p className="text-sm text-rose-600">{errors.incidentType}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        rows={5}
                        value={description}
                        onChange={(event) => {
                          setDescription(event.target.value);
                          clearFieldError('description');
                          setStatusMessage(null);
                        }}
                        placeholder="Describe what is happening and any immediate hazards."
                        className="bg-white"
                      />
                      {errors.description && (
                        <p className="text-sm text-rose-600">{errors.description}</p>
                      )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-3">
                        <Label>Location *</Label>
                        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
                            <MapPin className="h-4 w-4" />
                            Current location
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-lg bg-white/90 px-3 py-2">
                              <p className="text-xs text-slate-500">Latitude</p>
                              <p className="font-semibold text-slate-900">
                                {location ? location.lat.toFixed(5) : '--'}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white/90 px-3 py-2">
                              <p className="text-xs text-slate-500">Longitude</p>
                              <p className="font-semibold text-slate-900">
                                {location ? location.lng.toFixed(5) : '--'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {locationError && (
                          <p className="text-sm text-rose-600">{locationError}</p>
                        )}
                        {errors.location && (
                          <p className="text-sm text-rose-600">{errors.location}</p>
                        )}
                        <Button
                          type="button"
                          onClick={getLocation}
                          disabled={isLocating}
                          className="w-full bg-slate-900 text-white hover:bg-slate-800"
                        >
                          {isLocating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting location...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Get Current Location
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="photo">Upload Image (optional)</Label>
                        <div className="flex min-h-[168px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Incident preview"
                              className="h-40 w-full rounded-lg object-cover"
                            />
                          ) : (
                            <p className="text-sm text-slate-500">
                              Add a photo to help responders assess the situation.
                            </p>
                          )}
                        </div>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="h-auto bg-white py-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isFormValid}
                      className="h-12 w-full rounded-xl bg-red-600 text-base font-semibold text-white shadow-lg shadow-red-200/60 hover:bg-red-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Submitting report...
                        </>
                      ) : (
                        'REPORT EMERGENCY'
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Your details are shared only with emergency responders.
                    </p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  If the situation is life-threatening, contact local emergency services immediately.
                </div>
              </CardFooter>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
