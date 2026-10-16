import { queryOptions } from '@tanstack/react-query';
import { getPublicData } from './public-data.functions';
export const publicDataOptions = queryOptions({ queryKey: ['community-opportunities'], queryFn: () => getPublicData(), staleTime: 30000 });
