import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  ExpandMore,
  GavelRounded,
  CalendarToday,
  LocationOn,
  Warning,
  Info
} from '@mui/icons-material';

const RegulationsPanel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(3),
  right: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.95)',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  maxWidth: 400,
  maxHeight: '80vh',
  overflowY: 'auto'
}));

const StyledChip = styled(Chip)(({ theme, active }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: active ? theme.palette.success.main : theme.palette.grey[600],
  color: theme.palette.common.white
}));

const RegulationItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  borderLeft: `4px solid ${theme.palette.error.main}`
}));

const RegulationsGuide = ({ location }) => {
  const [regulations, setRegulations] = useState([]);
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // In production, this would fetch from an API
    // Mock data for Colorado hunting regulations
    const mockRegulations = {
      seasons: [
        {
          animal: 'Elk',
          methods: 'Rifle',
          start: '2025-10-15',
          end: '2025-11-18',
          units: ['1', '2', '3', '201'],
          restrictions: [
            'Valid hunting license required',
            'Hunter orange required',
            'No hunting 30 minutes after sunset until 30 minutes before sunrise'
          ],
          limits: 'One elk per license'
        },
        {
          animal: 'Deer',
          methods: 'Rifle',
          start: '2025-11-01',
          end: '2025-11-30',
          units: ['1', '2', '3', '201'],
          restrictions: [
            'Valid hunting license required',
            'Hunter orange required',
            'No baiting allowed'
          ],
          limits: 'One deer per license'
        },
        {
          animal: 'Moose',
          methods: 'Rifle',
          start: '2025-10-01',
          end: '2025-10-14',
          units: ['1', '2'],
          restrictions: [
            'Special permit required',
            'Hunter orange required',
            'Once-in-a-lifetime hunt'
          ],
          limits: 'One moose per lifetime'
        }
      ],
      generalRules: [
        {
          title: 'License Requirements',
          content: 'All hunters must complete a hunter safety course and possess a valid hunting license.'
        },
        {
          title: 'Legal Hunting Hours',
          content: '30 minutes before sunrise to 30 minutes after sunset.'
        },
        {
          title: 'Weapon Requirements',
          content: 'Rifles must be larger than .24 caliber. No fully automatic firearms.'
        }
      ],
      safetyTips: [
        'Always wear blaze orange during rifle seasons',
        'Clearly identify your target and what lies beyond',
        'Treat every firearm as if it were loaded',
        'Keep your finger off the trigger until ready to shoot'
      ]
    };

    setRegulations(mockRegulations);
  }, [location]);

  const handleRegulationClick = (regulation) => {
    setSelectedRegulation(regulation);
    setDialogOpen(true);
  };

  const isSeasonActive = (start, end) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return now >= startDate && now <= endDate;
  };

  return (
    <RegulationsPanel>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GavelRounded /> Hunting Regulations
      </Typography>

      <Typography variant="subtitle2" gutterBottom>
        <CalendarToday /> Active Seasons
      </Typography>
      <div style={{ marginBottom: '16px' }}>
        {regulations.seasons?.map((season, index) => (
          <StyledChip
            key={index}
            label={`${season.animal} - ${season.methods}`}
            active={isSeasonActive(season.start, season.end)}
            onClick={() => handleRegulationClick(season)}
          />
        ))}
      </div>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>
            <Warning /> Important Restrictions
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {regulations.generalRules?.map((rule, index) => (
            <RegulationItem key={index}>
              <Typography variant="subtitle2">{rule.title}</Typography>
              <Typography variant="body2">{rule.content}</Typography>
            </RegulationItem>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>
            <Info /> Safety Tips
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {regulations.safetyTips?.map((tip, index) => (
            <Typography key={index} variant="body2" gutterBottom>
              • {tip}
            </Typography>
          ))}
        </AccordionDetails>
      </Accordion>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedRegulation && (
          <>
            <DialogTitle>
              {selectedRegulation.animal} - {selectedRegulation.methods} Season
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle1" gutterBottom>
                <CalendarToday /> Season Dates
              </Typography>
              <Typography variant="body2" gutterBottom>
                {new Date(selectedRegulation.start).toLocaleDateString()} - {' '}
                {new Date(selectedRegulation.end).toLocaleDateString()}
              </Typography>

              <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
                <LocationOn /> Valid Units
              </Typography>
              <Typography variant="body2" gutterBottom>
                {selectedRegulation.units.join(', ')}
              </Typography>

              <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
                <Warning /> Restrictions
              </Typography>
              {selectedRegulation.restrictions.map((restriction, index) => (
                <Typography key={index} variant="body2" gutterBottom>
                  • {restriction}
                </Typography>
              ))}

              <Typography variant="subtitle1" gutterBottom style={{ marginTop: '16px' }}>
                <Info /> Bag Limits
              </Typography>
              <Typography variant="body2">
                {selectedRegulation.limits}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </RegulationsPanel>
  );
};

export default RegulationsGuide;
