import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchRandomHistoricalEvent, fetchRandomHistoricalEventFallback } from './services/wikipedia'

interface HistoricalEvent {
  title: string
  description: string
  imageUrl: string
  pageId: number
}

function App() {
  const [events, setEvents] = useState<HistoricalEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    loadInitialEvent()
    
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    } else if (savedDarkMode === 'false') {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      // Check system preference if no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const loadInitialEvent = async () => {
    try {
      setIsLoading(true)
      setError(null)
      let event;
      try {
        event = await fetchRandomHistoricalEvent()
      } catch (primaryError) {
        console.log('Primary method failed, trying fallback:', primaryError)
        event = await fetchRandomHistoricalEventFallback()
      }
      setEvents([event])
    } catch (err) {
      setError('Failed to load historical events. Please try again later.')
      console.error('Error loading events:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNextEvent = async () => {
    try {
      setIsLoadingMore(true)
      let newEvent;
      try {
        newEvent = await fetchRandomHistoricalEvent()
      } catch (primaryError) {
        console.log('Primary method failed, trying fallback:', primaryError)
        newEvent = await fetchRandomHistoricalEventFallback()
      }
      
      // Check if this event is already in our list
      const isDuplicate = events.some(event => event.pageId === newEvent.pageId)
      
      if (isDuplicate) {
        // If it's a duplicate, try again
        return loadNextEvent()
      }
      
      setEvents(prevEvents => {
        const newEvents = [...prevEvents, newEvent]
        setCurrentEventIndex(newEvents.length - 1)
        return newEvents
      })
    } catch (err) {
      console.error('Error loading next event:', err)
      setError('Failed to load more events. Please try again.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleNext = () => {
    // If we're at the last event, load a new one
    if (currentEventIndex === events.length - 1) {
      loadNextEvent()
    } else {
      setCurrentEventIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentEventIndex(prev => Math.max(0, prev - 1))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadInitialEvent}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-dark-muted mb-4">No historical events found.</p>
          <button
            onClick={loadInitialEvent}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            Load Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">FactFetch</h1>
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-dark-card text-gray-800 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEventIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="event-card"
            >
              <div className="aspect-w-16 aspect-h-9 mb-6 rounded-lg overflow-hidden">
                <img
                  src={events[currentEventIndex].imageUrl}
                  alt={events[currentEventIndex].title}
                  className="object-cover w-full h-full"
                />
              </div>
              
              <h2 className="event-title">
                {events[currentEventIndex].title}
              </h2>
              
              <p className="event-description">
                {events[currentEventIndex].description}
              </p>

              <a
                href={`https://en.wikipedia.org/?curid=${events[currentEventIndex].pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-accent hover:text-accent-dark dark:text-accent-light dark:hover:text-accent transition-colors"
              >
                Read more on Wikipedia →
              </a>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentEventIndex === 0}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoadingMore ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Loading...
                </>
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App 