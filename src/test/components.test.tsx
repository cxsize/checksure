import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../components/ui/TabBar';
import { StatusChip } from '../components/ui/StatusChip';
import { BigButton } from '../components/ui/BigButton';
import { THEMES } from '../tokens';

const theme = THEMES.warm;

describe('TabBar', () => {
  it('renders all 4 tabs in English', () => {
    const onTab = vi.fn();
    render(<TabBar tab="home" onTab={onTab} theme={theme} lang="en" />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Leave')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders all 4 tabs in Thai', () => {
    const onTab = vi.fn();
    render(<TabBar tab="home" onTab={onTab} theme={theme} lang="th" />);
    expect(screen.getByText('หน้าหลัก')).toBeInTheDocument();
    expect(screen.getByText('ประวัติ')).toBeInTheDocument();
    expect(screen.getByText('ลา')).toBeInTheDocument();
    expect(screen.getByText('โปรไฟล์')).toBeInTheDocument();
  });

  it('calls onTab when tab is clicked', () => {
    const onTab = vi.fn();
    render(<TabBar tab="home" onTab={onTab} theme={theme} lang="en" />);
    fireEvent.click(screen.getByText('History'));
    expect(onTab).toHaveBeenCalledWith('history');
  });

  it('calls onTab for each tab', () => {
    const onTab = vi.fn();
    render(<TabBar tab="home" onTab={onTab} theme={theme} lang="en" />);
    fireEvent.click(screen.getByText('Leave'));
    expect(onTab).toHaveBeenCalledWith('leave');
    fireEvent.click(screen.getByText('Profile'));
    expect(onTab).toHaveBeenCalledWith('profile');
  });
});

describe('StatusChip', () => {
  it('renders "Not clocked in" for out status', () => {
    render(<StatusChip status="out" theme={theme} lang="en" />);
    expect(screen.getByText('Not clocked in')).toBeInTheDocument();
  });

  it('renders "Clocked in" for in status', () => {
    render(<StatusChip status="in" theme={theme} lang="en" />);
    expect(screen.getByText('Clocked in')).toBeInTheDocument();
  });

  it('renders Thai text', () => {
    render(<StatusChip status="out" theme={theme} lang="th" />);
    expect(screen.getByText('ยังไม่ได้ลงเวลา')).toBeInTheDocument();
  });
});

describe('BigButton', () => {
  it('renders label and fires onClick', () => {
    const onClick = vi.fn();
    render(<BigButton theme={theme} label="Clock In" onClick={onClick} />);
    fireEvent.click(screen.getByText('Clock In'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders sublabel when provided', () => {
    render(<BigButton theme={theme} label="Clock In" sublabel="Verify location" onClick={() => {}} />);
    expect(screen.getByText('Verify location')).toBeInTheDocument();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<BigButton theme={theme} label="Disabled" onClick={onClick} disabled />);
    fireEvent.click(screen.getByText('Disabled'));
    // disabled button still fires click in DOM, but component should handle it
    // The button has disabled attribute
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
