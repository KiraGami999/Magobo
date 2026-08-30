'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  createMilestoneSchema,
  requestRevisionSchema,
  submitDeliverableSchema,
  type PublicProject,
} from '@magobo/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/magobo/form-field';
import { StatusBadge } from '@/components/magobo/status-badge';
import { LoadingState } from '@/components/magobo/loading-state';
import { ErrorState } from '@/components/magobo/error-state';
import { formatMinorCurrency } from '@/lib/format-money';
import { apiGet, apiPost } from '@/lib/api-client';
import { useCurrentUser } from '@/lib/use-current-user';

export default function ProjectWorkspacePage() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [revisionMessage, setRevisionMessage] = useState('');

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    const response = await apiGet<{ project: PublicProject }>(`/api/gigs/${params.id}/project`);
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }
    setProject(response.data.project);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function runAction(path: string, body: Record<string, unknown>, successMessage: string) {
    setActing(true);
    const response = await apiPost(path, body);
    setActing(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    toast.success(successMessage);
    await load();
  }

  async function addMilestone(event: FormEvent) {
    event.preventDefault();
    const parsed = createMilestoneSchema.safeParse({ title: milestoneTitle });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }
    await runAction(`/api/gigs/${params.id}/milestones`, parsed.data, 'Milestone added.');
    setMilestoneTitle('');
  }

  async function submitDeliverable(event: FormEvent) {
    event.preventDefault();
    const parsed = submitDeliverableSchema.safeParse({ notes: deliverableNotes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }
    await runAction(`/api/gigs/${params.id}/project/submit`, parsed.data, 'Deliverable submitted.');
    setDeliverableNotes('');
  }

  async function requestRevision(event: FormEvent) {
    event.preventDefault();
    const parsed = requestRevisionSchema.safeParse({ message: revisionMessage });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }
    await runAction(`/api/gigs/${params.id}/project/request-revision`, parsed.data, 'Revision requested.');
    setRevisionMessage('');
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!project) return null;

  const counterpart =
    project.owner.userId === user?.id ? project.provider : project.owner;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <StatusBadge tone="info" label={project.gigStatus.replaceAll('_', ' ')} />
          <h1 className="text-2xl font-semibold tracking-tight">{project.gigTitle}</h1>
          {counterpart && (
            <p className="text-muted-foreground text-sm">with {counterpart.fullName}</p>
          )}
        </div>
        <Link href="/projects" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          All projects
        </Link>
      </div>

      {project.canStart && (
        <Button disabled={acting} onClick={() => runAction(`/api/gigs/${params.id}/project/start`, {}, 'Project started.')}>
          Start project
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.milestones.length === 0 ? (
            <p className="text-muted-foreground text-sm">No milestones yet.</p>
          ) : (
            project.milestones.map((milestone) => (
              <div key={milestone.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{milestone.title}</span>
                  <StatusBadge tone="info" label={milestone.status.replaceAll('_', ' ')} />
                </div>
                {milestone.description && (
                  <p className="text-muted-foreground text-sm">{milestone.description}</p>
                )}
                {milestone.amountMinor !== null && (
                  <p className="text-sm">{formatMinorCurrency(milestone.amountMinor, milestone.currency)}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'REJECTED'].includes(milestone.status) &&
                    project.provider?.userId === user?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting}
                        onClick={() =>
                          runAction(`/api/milestones/${milestone.id}/submit`, {}, 'Milestone submitted.')
                        }
                      >
                        Mark submitted
                      </Button>
                    )}
                  {milestone.status === 'SUBMITTED' && project.owner.userId === user?.id && (
                    <>
                      <Button
                        size="sm"
                        disabled={acting}
                        onClick={() =>
                          runAction(`/api/milestones/${milestone.id}/approve`, {}, 'Milestone approved.')
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={acting}
                        onClick={() =>
                          runAction(`/api/milestones/${milestone.id}/reject`, {}, 'Milestone rejected.')
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {project.canManageMilestones && (
            <form className="flex flex-col gap-3 border-t pt-4" onSubmit={addMilestone}>
              <FormField id="milestoneTitle" label="Add milestone">
                <Input
                  id="milestoneTitle"
                  value={milestoneTitle}
                  onChange={(event) => setMilestoneTitle(event.target.value)}
                  placeholder="e.g. Initial design delivery"
                />
              </FormField>
              <Button type="submit" size="sm" variant="outline" disabled={acting}>
                Add milestone
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.deliverables.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet.</p>
          ) : (
            project.deliverables.map((deliverable) => (
              <div key={deliverable.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">Submission #{deliverable.submissionNumber}</span>
                  <StatusBadge tone="info" label={deliverable.status.replaceAll('_', ' ')} />
                </div>
                <p className="text-sm whitespace-pre-wrap">{deliverable.notes}</p>
                {deliverable.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.downloadUrl}
                    className="text-primary block text-xs underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attachment.originalFileName}
                  </a>
                ))}
              </div>
            ))
          )}

          {project.canSubmitDeliverable && (
            <form className="flex flex-col gap-3 border-t pt-4" onSubmit={submitDeliverable}>
              <FormField id="deliverableNotes" label="Submit your work">
                <textarea
                  id="deliverableNotes"
                  className="border-input bg-background min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                  value={deliverableNotes}
                  onChange={(event) => setDeliverableNotes(event.target.value)}
                  placeholder="Describe what you are delivering…"
                  required
                />
              </FormField>
              <Button type="submit" disabled={acting}>
                Submit deliverable
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {project.revisionRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revision history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.revisionRequests.map((revision) => (
              <div key={revision.id} className="rounded-lg border p-3">
                <p className="text-muted-foreground mb-1 text-xs">
                  {revision.requestedByName} · {new Date(revision.createdAt).toLocaleString()}
                </p>
                <p className="text-sm">{revision.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {project.canRequestRevision && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request revision</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={requestRevision}>
              <FormField id="revisionMessage" label="What needs to change?">
                <textarea
                  id="revisionMessage"
                  className="border-input bg-background min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
                  value={revisionMessage}
                  onChange={(event) => setRevisionMessage(event.target.value)}
                  required
                />
              </FormField>
              <Button type="submit" variant="outline" disabled={acting}>
                Request revision
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {project.canAcceptDeliverable && (
        <Button disabled={acting} onClick={() => runAction(`/api/gigs/${params.id}/project/accept`, {}, 'Work accepted.')}>
          Accept deliverable & complete project
        </Button>
      )}

      {project.gigStatus === 'COMPLETED' && project.completedAt && (
        <p className="text-muted-foreground text-sm">
          Completed {new Date(project.completedAt).toLocaleString()}.
        </p>
      )}
    </div>
  );
}
