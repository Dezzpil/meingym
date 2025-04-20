'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Container, Table, Badge, ProgressBar } from 'react-bootstrap';

interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

interface Job {
  id: string;
  name: string;
  data: any;
  progress: number;
  timestamp: number;
  attemptsMade: number;
  stacktrace: string[];
  returnvalue?: any;
}

interface QueueStatus {
  counts: JobCounts;
  active: Job[];
}

interface JobsStatus {
  queues: {
    actions: QueueStatus;
    users: QueueStatus;
  };
}

export default function JobsMonitorPage() {
  const [status, setStatus] = useState<JobsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Error fetching job status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const triggerUpdateAllActions = async () => {
    try {
      setActionResult('Scheduling job...');
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'update-all-actions' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule job');
      }
      
      setActionResult(`Job scheduled successfully! Job ID: ${data.jobId}`);
      // Refresh status after scheduling a job
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      setActionResult('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  useEffect(() => {
    fetchStatus();
    // Set up polling to refresh status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Container className="py-4">
      <h1>Background Jobs Monitor</h1>
      
      <div className="mb-4">
        <Button onClick={fetchStatus} disabled={loading} className="me-2">
          Refresh Status
        </Button>
        <Button onClick={triggerUpdateAllActions} variant="primary">
          Trigger Update All Actions
        </Button>
        {actionResult && (
          <div className="mt-2">
            <Badge bg={actionResult.includes('Error') ? 'danger' : 'success'}>
              {actionResult}
            </Badge>
          </div>
        )}
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading && !status && <div>Loading...</div>}
      
      {status && (
        <>
          <h2>Queues Overview</h2>
          
          <div className="row">
            {Object.entries(status.queues).map(([queueName, queueStatus]) => (
              <div className="col-md-6 mb-4" key={queueName}>
                <Card>
                  <Card.Header>
                    <h3 className="mb-0">{queueName.charAt(0).toUpperCase() + queueName.slice(1)} Queue</h3>
                  </Card.Header>
                  <Card.Body>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(queueStatus.counts).map(([status, count]) => (
                          <tr key={status}>
                            <td>{status.charAt(0).toUpperCase() + status.slice(1)}</td>
                            <td>
                              <Badge bg={
                                status === 'failed' ? 'danger' :
                                status === 'active' ? 'primary' :
                                status === 'completed' ? 'success' :
                                'secondary'
                              }>
                                {count}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
          
          <h2>Active Jobs</h2>
          
          {Object.entries(status.queues).map(([queueName, queueStatus]) => (
            <div key={`active-${queueName}`} className="mb-4">
              <h3>{queueName.charAt(0).toUpperCase() + queueName.slice(1)} Active Jobs</h3>
              
              {queueStatus.active.length === 0 ? (
                <p>No active jobs</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Progress</th>
                      <th>Started</th>
                      <th>Attempts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueStatus.active.map(job => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>{job.name}</td>
                        <td>
                          <ProgressBar now={job.progress} label={`${job.progress}%`} />
                        </td>
                        <td>{formatDate(job.timestamp)}</td>
                        <td>{job.attemptsMade}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          ))}
        </>
      )}
    </Container>
  );
}