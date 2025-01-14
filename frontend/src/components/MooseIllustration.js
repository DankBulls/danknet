import React from 'react';
import styled from 'styled-components';

const SVGWrapper = styled.svg`
  width: ${props => props.width || '200px'};
  height: auto;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const MooseIllustration = ({ width }) => {
  return (
    <SVGWrapper
      width={width}
      viewBox="0 0 800 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mountain Background */}
      <path
        d="M0 300L300 100L500 200L800 50V600H0V300Z"
        fill="#2B95CE"
      />
      
      {/* Moose Bodies */}
      <path
        d="M300 400C300 400 350 380 400 380C450 380 480 400 500 400C520 400 550 380 600 380C650 380 700 400 700 400V500H300V400Z"
        fill="#5C3C24"
      />
      <path
        d="M200 420C200 420 250 400 300 400C350 400 380 420 400 420C420 420 450 400 500 400C550 400 600 420 600 420V520H200V420Z"
        fill="#8B7355"
      />
      
      {/* Antlers */}
      <path
        d="M320 380C320 380 300 350 310 330C320 310 350 300 360 310C370 320 380 350 370 370C360 390 340 380 320 380Z"
        fill="#8B7355"
      />
      <path
        d="M520 380C520 380 500 350 510 330C520 310 550 300 560 310C570 320 580 350 570 370C560 390 540 380 520 380Z"
        fill="#8B7355"
      />
      
      {/* Eyes */}
      <circle cx="340" cy="390" r="5" fill="#2C1810"/>
      <circle cx="540" cy="390" r="5" fill="#2C1810"/>
    </SVGWrapper>
  );
};

export default MooseIllustration;
