import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, AlertCircle } from 'lucide-react';

export function EmailNotificationModal({ open, onClose, onSubmit, estimatedTime }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(email);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to register email notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[425px]" data-testid="email-notification-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Get Notified by Email
          </DialogTitle>
          <DialogDescription>
            {estimatedTime ? (
              <>This may take over {estimatedTime} minutes. </>
            ) : (
              <>Processing is taking longer than expected. </>
            )}
            Enter your email to receive a download link when ready.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              data-testid="email-input"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600" data-testid="email-error">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            We'll send you a link that's valid for 24 hours. You can safely close this page after submitting.
          </div>
        </form>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Continue Waiting
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} data-testid="submit-email-btn">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Notify Me'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
