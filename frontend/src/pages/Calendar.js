import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Paper, 
  Typography, 
  Grid, 
  Button,
  IconButton
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight,
  Event as EventIcon
} from '@mui/icons-material';
import MooseIllustration from '../components/MooseIllustration';

const CalendarContainer = styled(Paper)`
  padding: ${props => props.theme.spacing.large};
  margin: ${props => props.theme.spacing.large};
  background: ${props => props.theme.colors.cream};
  border-radius: ${props => props.theme.borderRadius};
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.large};
`;

const MonthTitle = styled(Typography)`
  color: ${props => props.theme.colors.mooseBrown};
  font-family: ${props => props.theme.fonts.heading} !important;
  font-weight: bold !important;
`;

const WeekdayHeader = styled(Grid)`
  background: ${props => props.theme.colors.mooseBrown};
  color: ${props => props.theme.colors.cream};
  padding: ${props => props.theme.spacing.small};
  text-align: center;
  font-weight: bold;
  border-radius: ${props => props.theme.borderRadius} ${props => props.theme.borderRadius} 0 0;
`;

const DayCell = styled(Paper)`
  aspect-ratio: 1;
  padding: ${props => props.theme.spacing.small};
  background: ${props => 
    props.isToday 
      ? props.theme.colors.sand
      : props.isCurrentMonth 
        ? 'white' 
        : props.theme.colors.cream};
  position: relative;
  cursor: pointer;
  transition: ${props => props.theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.boxShadow};
  }
`;

const Event = styled.div`
  background: ${props => props.theme.colors.blazeOrange};
  color: ${props => props.theme.colors.cream};
  padding: 2px 4px;
  border-radius: 4px;
  margin: 2px 0;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BackgroundIllustration = styled.div`
  position: absolute;
  right: -100px;
  bottom: -100px;
  opacity: 0.05;
  pointer-events: none;
`;

// Helper functions
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Elk season dates
  const elkSeasonStart = new Date(2025, 9, 1); // October 1st, 2025
  const elkSeasonEnd = new Date(2025, 10, 14); // November 14th, 2025

  // Generate calendar days
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const days = [];

  // Previous month days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({
      day: getDaysInMonth(currentYear, currentMonth - 1) - firstDayOfMonth + i + 1,
      currentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      currentMonth: true,
      events: []
    });
  }

  // Add events
  const today = new Date();
  const events = {
    // Add scouting trips every other Sunday
    "2025-01-12": ["Scouting Trip - GMU 511"],
    "2025-01-26": ["Scouting Trip - GMU 511"],
    "2025-02-09": ["Scouting Trip - GMU 511"],
    "2025-02-23": ["Scouting Trip - GMU 511"],
    "2025-10-01": ["Elk Season Starts!"],
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  return (
    <CalendarContainer elevation={3}>
      <Header>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        <MonthTitle variant="h4">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </MonthTitle>
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Header>

      <Grid container>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <WeekdayHeader item xs key={day}>
            <Typography>{day}</Typography>
          </WeekdayHeader>
        ))}
      </Grid>

      <Grid container>
        {days.map((day, index) => {
          const date = new Date(currentYear, currentMonth, day.day);
          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = events[dateStr] || [];

          return (
            <Grid item xs={12/7} key={index}>
              <DayCell 
                elevation={0}
                isCurrentMonth={day.currentMonth}
                isToday={
                  day.day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear()
                }
              >
                <Typography>{day.day}</Typography>
                {dayEvents.map((event, i) => (
                  <Event key={i}>
                    <EventIcon fontSize="small" />
                    {event}
                  </Event>
                ))}
              </DayCell>
            </Grid>
          );
        })}
      </Grid>

      <BackgroundIllustration>
        <MooseIllustration width="500px" />
      </BackgroundIllustration>
    </CalendarContainer>
  );
};

export default Calendar;
