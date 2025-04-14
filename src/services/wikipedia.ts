interface WikipediaResponse {
  query: {
    pages: {
      [key: string]: {
        title: string;
        extract: string;
        pageid: number;
        thumbnail?: {
          source: string;
        };
      };
    };
  };
}

interface OnThisDayResponse {
  text: string;
  pages: Array<{
    title: string;
    pageid: number;
    thumbnail?: {
      source: string;
    };
  }>;
}

export async function fetchRandomHistoricalEvent(): Promise<{
  title: string;
  description: string;
  imageUrl: string;
  pageId: number;
}> {
  try {
    // Get current date
    const today = new Date();
    const month = today.getMonth() + 1; // JavaScript months are 0-indexed
    const day = today.getDate();
    
    // Fetch events from Wikipedia's "On This Day" API
    const onThisDayResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}?language=en`
    );
    
    if (!onThisDayResponse.ok) {
      console.error('Wikipedia API error:', onThisDayResponse.status, onThisDayResponse.statusText);
      throw new Error(`Wikipedia API error: ${onThisDayResponse.status}`);
    }
    
    const onThisDayData = await onThisDayResponse.json();
    
    // Check if we have valid data
    if (!Array.isArray(onThisDayData) || onThisDayData.length === 0) {
      console.error('No events found in the response');
      throw new Error('No historical events found');
    }
    
    // Select a random event from the list
    const randomIndex = Math.floor(Math.random() * onThisDayData.length);
    const selectedEvent = onThisDayData[randomIndex];
    
    // Get the first page from the event
    const pageId = selectedEvent.pages?.[0]?.pageid;
    
    if (!pageId) {
      // Fallback to a default image if no page is found
      return {
        title: selectedEvent.text.split(' – ')[0] || 'Historical Event',
        description: selectedEvent.text,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3',
        pageId: 0,
      };
    }
    
    // Get the page details including extract and thumbnail
    const pageDetailsResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
    );
    
    if (!pageDetailsResponse.ok) {
      console.error('Wikipedia page details API error:', pageDetailsResponse.status, pageDetailsResponse.statusText);
      throw new Error(`Failed to fetch page details: ${pageDetailsResponse.status}`);
    }
    
    const pageDetails: WikipediaResponse = await pageDetailsResponse.json();
    const page = pageDetails.query.pages[pageId];
    
    if (!page) {
      throw new Error('Page not found in Wikipedia response');
    }
    
    return {
      title: page.title,
      description: page.extract,
      imageUrl: page.thumbnail?.source || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3',
      pageId: page.pageid,
    };
  } catch (error) {
    console.error('Error fetching historical event:', error);
    throw error;
  }
}

// Fallback function to get a random historical event if the "On This Day" API fails
export async function fetchRandomHistoricalEventFallback(): Promise<{
  title: string;
  description: string;
  imageUrl: string;
  pageId: number;
}> {
  try {
    // Get a random page from Wikipedia
    const randomPageResponse = await fetch(
      'https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json&origin=*'
    );
    
    if (!randomPageResponse.ok) {
      throw new Error(`Random page API error: ${randomPageResponse.status}`);
    }
    
    const randomPageData = await randomPageResponse.json();
    const pageId = randomPageData.query.random[0].id;
    
    // Get the page details including extract and thumbnail
    const pageDetailsResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=500&format=json&origin=*`
    );
    
    if (!pageDetailsResponse.ok) {
      throw new Error(`Failed to fetch page details: ${pageDetailsResponse.status}`);
    }
    
    const pageDetails: WikipediaResponse = await pageDetailsResponse.json();
    const page = pageDetails.query.pages[pageId];
    
    return {
      title: page.title,
      description: page.extract,
      imageUrl: page.thumbnail?.source || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3',
      pageId: page.pageid,
    };
  } catch (error) {
    console.error('Error in fallback method:', error);
    throw error;
  }
}

export async function fetchMultipleHistoricalEvents(count: number = 5): Promise<Array<{
  title: string;
  description: string;
  imageUrl: string;
  pageId: number;
}>> {
  const events = await Promise.all(
    Array(count)
      .fill(null)
      .map(() => fetchRandomHistoricalEvent())
  );
  return events;
} 