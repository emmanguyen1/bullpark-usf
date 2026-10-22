import { Router, Request, Response } from 'express';
import { userService } from './user.service';

export const authRouter = Router();

const getParamId = (req: Request): string => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

// Register new user account
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, studentId, major, permitType, commutePreferences } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    const user = userService.register({
      email,
      password,
      name,
      studentId,
      major,
      permitType,
      commutePreferences
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Sign In
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = userService.login({ email, password });
    return res.json({
      message: `Welcome back, ${user.name}!`,
      user
    });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Sign in failed' });
  }
});

// Get user profile
authRouter.get('/profile/:id', (req: Request, res: Response) => {
  try {
    const user = userService.getUserById(getParamId(req));
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update general profile
authRouter.put('/profile/:id', (req: Request, res: Response) => {
  try {
    const updated = userService.updateProfile(getParamId(req), req.body);
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Save schedule
authRouter.put('/schedule/:id', (req: Request, res: Response) => {
  try {
    const { schedule } = req.body;
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array of courses' });
    }
    const updated = userService.saveSchedule(getParamId(req), schedule);
    return res.json({ message: 'Schedule saved to user account', user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Save parking permit
authRouter.put('/permit/:id', (req: Request, res: Response) => {
  try {
    const { permitType } = req.body;
    if (!permitType) {
      return res.status(400).json({ error: 'Permit type is required' });
    }
    const updated = userService.savePermit(getParamId(req), permitType);
    return res.json({ message: `Permit updated to [${permitType}]`, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Save pinned car / parked location
authRouter.put('/pinned-car/:id', (req: Request, res: Response) => {
  try {
    const { lotId } = req.body;
    const updated = userService.savePinnedCar(getParamId(req), lotId || null);
    return res.json({
      message: lotId ? `Parked vehicle saved` : 'Vehicle pin cleared',
      user: updated
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Save commute preferences
authRouter.put('/preferences/:id', (req: Request, res: Response) => {
  try {
    const updated = userService.savePreferences(getParamId(req), req.body);
    return res.json({ message: 'Commute preferences saved', user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Demo accounts for instant test login
authRouter.get('/demo-users', (_req: Request, res: Response) => {
  try {
    const users = userService.getAllDemoUsers();
    return res.json({ demoUsers: users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
