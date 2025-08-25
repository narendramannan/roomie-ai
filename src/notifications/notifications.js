export const playNotificationSound = () => {
  try {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.log('Audio context not supported');
      return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    console.log('🔊 Notification sound played successfully');

    setTimeout(() => {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    }, 300);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};
