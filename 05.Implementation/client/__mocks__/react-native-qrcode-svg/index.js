// Mock for react-native-qrcode-svg
const React = require('react');
const { View, Text } = require('react-native');

// Create a more testable QR code mock that exposes its props
const QRCode = (props) => {
  return React.createElement(
    View, 
    { 
      testID: props.testID || 'qrcode',
      style: { 
        width: props.size || 200, 
        height: props.size || 200, 
        backgroundColor: '#f0f0f0', 
        justifyContent: 'center', 
        alignItems: 'center',
        ...props.style
      },
      'data-qr-value': props.value, // Store the QR value as a data attribute for testing
      'data-qr-size': props.size,
      'data-qr-color': props.color,
      'data-qr-background': props.backgroundColor,
    },
    React.createElement(
      Text,
      { 
        style: { color: props.color || '#000' },
        testID: 'qrcode-text'
      },
      `QR: ${props.value || 'mock-qr-value'}`
    )
  );
};

module.exports = QRCode; 