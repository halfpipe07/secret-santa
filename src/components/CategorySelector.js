"use client";

import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogAction, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import Pusher from 'pusher-js';

const CategorySelector = () => {
  const [categories, setCategories] = useState([
    { "id": 1, "title": "Something to add to your latest 'budol'", "subtitle": "Impulse items like quirky mini perfumes or stylish little luxuries", "selected": false, "code": null },
    { "id": 2, "title": "Perfect for Saturdays", "subtitle": "Mga gamit para sa \"Walang kapaguran\" moments, from cozy blankets, self-care items to hobby starter packs", "selected": false, "code": null },
    { "id": 3, "title": "Something every tito/tita would carry", "subtitle": "Items that are handy for travel, like travel kits, band-aids, essential oils, or a mini sewing kit", "selected": false, "code": null },
    { "id": 4, "title": "Balik-alindog pero di pa ngayon", "subtitle": "Health-related gifts like water bottles, fitness journals, or stretching bands", "selected": false, "code": null },
    { "id": 5, "title": "Something na hindi obvious pero i will appreciate 10 years from now", "subtitle": "Thoughtful keepsakes, like items that gain value with time", "selected": false, "code": null },
    { "id": 6, "title": "Sikat nung 90's", "subtitle": "Throwback treasures like Tamagotchi, pogs, or plastic balloon na magpapa-nostalgic sa 'yo", "selected": false, "code": null },
    { "id": 7, "title": "Something to share with friends and family", "subtitle": "Bonding essentials like board games, party favors, o kaya yung mga picture frames na puno ng memories", "selected": false, "code": null },
    { "id": 8, "title": "Pang-beast mode sa work", "subtitle": "Items for productivity, like a desktop toy, mini whiteboard or quirky office supplies", "selected": false, "code": null },
    { "id": 9, "title": "Pang-reset ng good vibes", "subtitle": "Books, fresh-start journals or motivational planners, meditation apps are great here", "selected": false, "code": null },
    { "id": 10, "title": "Something out of this world", "subtitle": "Mga items na mapapasabi ka ng \"Saan mo 'to nakita?!\"", "selected": false, "code": null }
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/selection');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        // If categories exist in DB, update state
        if (data.length > 0) {
          setCategories(prevCategories => 
            prevCategories.map(category => {
              const dbCategory = data.find(c => c.id === category.id);
              if (dbCategory) {
                return {
                  ...category,
                  selected: dbCategory.selected,
                  code: dbCategory.code
                };
              }
              return category;
            })
          );
        } else {
          // Initialize database with categories if it's empty
          await fetch('/api/selection/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ categories }),
          });
        }
        setIsLoading(false);  // Add this line
      } catch (error) {
        console.error('Error fetching categories:', error);
        setIsLoading(false);  // Add this line
      }
    };
    fetchCategories();
  }, []);

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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg text-gray-600">Loading categories...</span>
      </div>
    );
  }


  return (
     <>

      <div className="max-w-md mx-auto p-4 text-center text-white">
        <img src="https://www.botbros.ai/images/bb-logo.png" className="inline" width="60%" />
      </div>
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
                  ? 'bg-gray-200 border-gray-300 cursor-not-allowed' 
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
                <h3 className={`text-lg font-semibold ${category.selected ? 'line-through text-gray-500' : ''}`}>
                  {category.title}
                </h3>
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
                    You have already made a selection. Each person can only select one category.
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
                <div className="sr-only">
                  <AlertDialogTitle>Category Selected!</AlertDialogTitle>
                </div>
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
                  Please save this code. You&apos;ll need it to verify your selection.
                </p>
              </div>
            </>
          )}
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategorySelector;