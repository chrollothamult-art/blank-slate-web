import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { PrivateMessaging } from './PrivateMessaging';

interface MessageButtonProps {
  userId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const MessageButton = ({ userId, variant = 'outline', size = 'sm', className }: MessageButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Message
      </Button>
      <PrivateMessaging
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialUserId={userId}
      />
    </>
  );
};
