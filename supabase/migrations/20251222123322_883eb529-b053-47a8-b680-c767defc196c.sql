-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create mind_maps table
CREATE TABLE public.mind_maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Novo Mapa Mental',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mind_map_nodes table
CREATE TABLE public.mind_map_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 0,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 0,
  width DOUBLE PRECISION DEFAULT 200,
  height DOUBLE PRECISION DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mind_map_connections table
CREATE TABLE public.mind_map_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mind_map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mind_maps
CREATE POLICY "Users can view their own mind maps" ON public.mind_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own mind maps" ON public.mind_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mind maps" ON public.mind_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mind maps" ON public.mind_maps FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mind_map_nodes
CREATE POLICY "Users can view nodes of their mind maps" ON public.mind_map_nodes FOR SELECT USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can create nodes in their mind maps" ON public.mind_map_nodes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can update nodes in their mind maps" ON public.mind_map_nodes FOR UPDATE USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete nodes in their mind maps" ON public.mind_map_nodes FOR DELETE USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));

-- RLS Policies for mind_map_connections
CREATE POLICY "Users can view connections of their mind maps" ON public.mind_map_connections FOR SELECT USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can create connections in their mind maps" ON public.mind_map_connections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can update connections in their mind maps" ON public.mind_map_connections FOR UPDATE USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete connections in their mind maps" ON public.mind_map_connections FOR DELETE USING (EXISTS (SELECT 1 FROM public.mind_maps WHERE id = mind_map_id AND user_id = auth.uid()));

-- Create storage bucket for mind map images
INSERT INTO storage.buckets (id, name, public) VALUES ('mind-map-images', 'mind-map-images', true);

-- Storage policies
CREATE POLICY "Users can upload mind map images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mind-map-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Mind map images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'mind-map-images');
CREATE POLICY "Users can delete their mind map images" ON storage.objects FOR DELETE USING (bucket_id = 'mind-map-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at
CREATE TRIGGER update_mind_maps_updated_at
BEFORE UPDATE ON public.mind_maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();