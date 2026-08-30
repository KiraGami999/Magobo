import { ok, withErrorHandling } from '@/server/api-response';
import { listCategories } from '@/server/services/profile.service';

export const GET = withErrorHandling(async () => {
  const categories = await listCategories();
  return ok({ categories });
});
