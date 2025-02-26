import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TimerApp = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const loadTimerState = async () => {
      const savedStartTime = await AsyncStorage.getItem('startTime');
      const savedIsRunning = await AsyncStorage.getItem('isRunning');

      if (savedStartTime) {
        const startUnix = parseInt(savedStartTime, 10);
        const now = Date.now();
        setStartTime(startUnix);
        setTime(savedIsRunning === 'true' ? now - startUnix : 0);
        setIsRunning(savedIsRunning === 'true');
      }
    };
    loadTimerState();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
    } else {
      clearInterval(interval);
    }
    AsyncStorage.setItem('isRunning', isRunning.toString());
    setShowReset(time > 0);
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        const savedStartTime = await AsyncStorage.getItem('startTime');
        const savedIsRunning = await AsyncStorage.getItem('isRunning');

        if (savedIsRunning === 'true' && savedStartTime) {
          const startUnix = parseInt(savedStartTime, 10);
          setStartTime(startUnix);
          setTime(Date.now() - startUnix);
          setIsRunning(true);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleStartPause = async () => {
    if (!isRunning) {
      const now = Date.now();
      setStartTime(now);
      await AsyncStorage.setItem('startTime', now.toString());
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = async () => {
    setIsRunning(false);
    setTime(0);
    setStartTime(null);
    setShowReset(false);
    await AsyncStorage.removeItem('startTime');
    await AsyncStorage.removeItem('isRunning');
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = (time % 1000).toString().padStart(3, '0');
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.timer}>{formatTime(time)}</Text>
        <TouchableOpacity style={styles.button} onPress={handleStartPause}>
          <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
        {showReset && (
          <TouchableOpacity style={[styles.button, { backgroundColor: '#808080', marginTop: 10 }]} onPress={resetTimer}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default TimerApp;
