-- Create chronology_events table
CREATE TABLE public.chronology_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  era TEXT NOT NULL CHECK (era IN ('BGD', 'GD', 'AGD')),
  description TEXT NOT NULL,
  article TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chronology_events ENABLE ROW LEVEL SECURITY;

-- Create policies - anyone can read, only admins can modify
CREATE POLICY "Anyone can view chronology events" 
ON public.chronology_events 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert chronology events" 
ON public.chronology_events 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chronology events" 
ON public.chronology_events 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chronology events" 
ON public.chronology_events 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chronology_events_updated_at
BEFORE UPDATE ON public.chronology_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();