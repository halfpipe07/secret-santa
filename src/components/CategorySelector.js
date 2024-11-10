"use client";

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Pusher from 'pusher-js';

const CategorySelector = () => {
  const [categories, setCategories] = useState([
    { id: 1, title: 'Category 1', subtitle: 'Subtitle 1', selected: false, code: null },
    { id: 2, title: 'Category 2', subtitle: 'Subtitle 2', selected: false, code: null },
    { id: 3, title: 'Category 3', subtitle: 'Subtitle 3', selected: false, code: null },
    { id: 4, title: 'Category 4', subtitle: 'Subtitle 4', selected: false, code: null },
    { id: 5, title: 'Category 5', subtitle: 'Subtitle 5', selected: false, code: null },
    { id: 6, title: 'Category 6', subtitle: 'Subtitle 6', selected: false, code: null },
    { id: 7, title: 'Category 7', subtitle: 'Subtitle 7', selected: false, code: null },
    { id: 8, title: 'Category 8', subtitle: 'Subtitle 8', selected: false, code: null },
  ]);

  const [deviceId, setDeviceId] = useState(null);
  const [hasSelected, setHasSelected] = useState(false);
  const [hasSelectedMessage, setHasSelectedMessage] = useState(false);
  const [pressedId, setPressedId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [usedCodes] = useState(new Set());
  const [pressTimer, setPressTimer] = useState(null);
  const [progressInterval, setProgressInterval] = useState(null);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });

    const channel = pusher.subscribe('category-channel');
    
    channel.bind('category-selected', data => {
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === data.categoryId
            ? { ...category, selected: true, code: data.code }
            : category
        )
      );
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = `device_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', newDeviceId);
      setDeviceId(newDeviceId);
    }

    const hasSelectedStorage = localStorage.getItem('hasSelected');
    if (hasSelectedStorage) {
      setHasSelected(true);
    }
  }, []);

  const generateUniqueCode = () => {
    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0');
    } while (usedCodes.has(code));
    usedCodes.add(code);
    return code;
  };

   const startPress = (categoryId) => {
    if (hasSelected) {
      setHasSelectedMessage(true);
      setShowModal(true);
      return;
    }
    if (categories.find(c => c.id === categoryId).selected) return;
    
    setPressedId(categoryId);
    setProgress(0);
    
    // Clear any existing intervals/timers
    if (progressInterval) clearInterval(progressInterval);
    if (pressTimer) clearTimeout(pressTimer);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    
    const timer = setTimeout(() => {
      handleLongPressComplete(categoryId);
      clearInterval(interval);
    }, 2000);
    
    setProgressInterval(interval);
    setPressTimer(timer);
  };

  const endPress = () => {
    if (progressInterval) clearInterval(progressInterval);
    if (pressTimer) clearTimeout(pressTimer);
    
    if (progress < 100) {
      setPressedId(null);
      setProgress(0);
    }
  };

  const handleLongPressComplete = async (categoryId) => {
    if (hasSelected) return;
    
    const code = generateUniqueCode();
    const selectedCategory = categories.find(c => c.id === categoryId);
    
    // Update local state
    setCategories(prevCategories => 
      prevCategories.map(category => 
        category.id === categoryId
          ? { ...category, selected: true, code: code }
          : category
      )
    );
    
    setCurrentSelection({
      category: selectedCategory,
      code: code
    });
    
    setHasSelected(true);
    localStorage.setItem('hasSelected', 'true');
    
    // Notify server
    try {
      const response = await fetch('/api/selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          code,
          categoryTitle: selectedCategory.title,
          deviceId
        }),
      });

      if (!response.ok) throw new Error('Failed to send selection');
    } catch (error) {
      console.error('Error:', error);
    }
    
    setPressedId(null);
    setProgress(0);
    setShowModal(true);
  };

  return (
     <>
      <div className="max-w-md mx-auto p-4">
        {categories.map((category) => {
          const isPressed = pressedId === category.id;
          
          return (
            <div
              key={category.id}
              onMouseDown={() => startPress(category.id)}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={(e) => {
                e.preventDefault();
                startPress(category.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                endPress();
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                endPress();
              }}
              className={`
                relative mb-4 p-4 rounded-lg border-2 overflow-hidden select-none touch-none
                ${category.selected 
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                  : hasSelected
                  ? 'bg-gray-50 border-gray-300 cursor-not-allowed'
                  : 'bg-white border-blue-500 cursor-pointer hover:bg-blue-50'
                }
              `}
            >
              {isPressed && !category.selected && !hasSelected && (
                <div 
                  className="absolute inset-0 bg-blue-500 transition-transform duration-100 origin-left"
                  style={{ 
                    transform: `scaleX(${progress / 100})`,
                    opacity: 0.2
                  }}
                />
              )}
              <div className="relative z-10">
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <p className="text-gray-600">{category.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          {hasSelectedMessage ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Already Selected</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="text-center py-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    You have already made a selection. Each device can only select one category.
                  </p>
                  {currentSelection && (
                    <>
                      <p className="mt-4 text-sm text-gray-600">Your selection:</p>
                      <h2 className="text-xl font-semibold text-gray-900 mt-2">
                        {currentSelection.category.title}
                      </h2>
                      <p className="text-4xl font-bold tracking-wider text-blue-600 mt-4">
                        {currentSelection.code}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Category Selected!</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="text-center py-6">
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-1">You have selected:</p>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentSelection?.category.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentSelection?.category.subtitle}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Your unique code is:</p>
                  <p className="text-4xl font-bold tracking-wider text-blue-600">
                    {currentSelection?.code}
                  </p>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Please save this code. You'll need it to verify your selection.
                </p>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategorySelector;