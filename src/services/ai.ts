import { storage } from "./storage"
import { tmdb } from "./tmdb"

interface AIRecommendation {
    title: string
    year?: number
}

class AIService {
    private apiKey: string
    private apiUrl: string

    constructor() {
        this.apiKey = import.meta.env.VITE_LLM_API_KEY || ""
        this.apiUrl =
            import.meta.env.VITE_LLM_API_URL || "https://api.openai.com/v1/chat/completions"
    }

    async getRecommendations(userInput: string): Promise<AIRecommendation[]> {
        if (!this.apiKey) {
            console.warn("LLM API key not configured")
            return []
        }

        const favoriteMovies = storage.getFavoriteMovies()

        // Build CSV of user's rated movies
        const ratingsCSV = await this.buildRatingsCSV()

        const prompt = `Please generate the top three movie recommendations for someone with:
(A) The request: "${userInput}"
(B) The following movie ratings: 
${ratingsCSV}

Return only movie titles and years in your response in this format:
1. Movie Title (Year)
2. Movie Title (Year)
3. Movie Title (Year)`

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a movie recommendation expert. Provide exactly 3 movie recommendations based on the user's request and their rating history."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 200
                })
            })

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`)
            }

            const data = await response.json()
            const content = data.choices[0]?.message?.content || ""

            return this.parseRecommendations(content)
        } catch (error) {
            console.error("Failed to get AI recommendations:", error)
            // Return placeholder recommendations if API fails
            return this.getPlaceholderRecommendations(userInput)
        }
    }

    private async buildRatingsCSV(): Promise<string> {
        const ratings = storage.getAllRatings()
        if (ratings.length === 0) {
            return "No ratings yet"
        }

        const csvLines = ["Movie Name, Year, Director, Rating"]

        for (const rating of ratings.slice(0, 10)) {
            // Limit to 10 most recent
            try {
                const [details, credits] = await Promise.all([
                    tmdb.getMovieDetails(rating.movieId),
                    tmdb.getMovieCredits(rating.movieId)
                ])

                const director = credits.crew.find((p) => p.job === "Director")?.name || "Unknown"
                const year = details.release_date
                    ? new Date(details.release_date).getFullYear()
                    : "Unknown"

                csvLines.push(`${details.title}, ${year}, ${director}, ${rating.rating}`)
            } catch (error) {
                console.error(`Failed to get details for movie ${rating.movieId}:`, error)
            }
        }

        return csvLines.join("\n")
    }

    private parseRecommendations(content: string): AIRecommendation[] {
        const recommendations: AIRecommendation[] = []

        // Match patterns like "1. Movie Title (Year)" or "Movie Title (Year)"
        const patterns = [/\d+\.\s*(.+?)\s*\((\d{4})\)/g, /^(.+?)\s*\((\d{4})\)$/gm]

        for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
                recommendations.push({
                    title: match[1].trim(),
                    year: Number.parseInt(match[2], 10)
                })
            }
        }

        // If no matches with year, try to match just titles
        if (recommendations.length === 0) {
            const titlePattern = /\d+\.\s*(.+?)(?:\n|$)/g
            let match
            while ((match = titlePattern.exec(content)) !== null) {
                recommendations.push({
                    title: match[1].trim()
                })
            }
        }

        return recommendations.slice(0, 3)
    }

    private getPlaceholderRecommendations(userInput: string): AIRecommendation[] {
        // Provide sensible defaults based on common requests
        const input = userInput.toLowerCase()

        if (input.includes("action") || input.includes("exciting")) {
            return [
                { title: "Mad Max: Fury Road", year: 2015 },
                { title: "John Wick", year: 2014 },
                { title: "The Dark Knight", year: 2008 }
            ]
        }
        if (input.includes("comedy") || input.includes("funny") || input.includes("laugh")) {
            return [
                { title: "The Grand Budapest Hotel", year: 2014 },
                { title: "Superbad", year: 2007 },
                { title: "The Hangover", year: 2009 }
            ]
        }
        if (input.includes("romance") || input.includes("love")) {
            return [
                { title: "La La Land", year: 2016 },
                { title: "The Notebook", year: 2004 },
                { title: "Eternal Sunshine of the Spotless Mind", year: 2004 }
            ]
        }
        if (input.includes("scary") || input.includes("horror")) {
            return [
                { title: "Get Out", year: 2017 },
                { title: "Hereditary", year: 2018 },
                { title: "The Conjuring", year: 2013 }
            ]
        }
        if (input.includes("family") || input.includes("kids")) {
            return [
                { title: "Coco", year: 2017 },
                { title: "Inside Out", year: 2015 },
                { title: "The Incredibles", year: 2004 }
            ]
        }
        // Default recommendations
        return [
            { title: "Inception", year: 2010 },
            { title: "Interstellar", year: 2014 },
            { title: "The Shawshank Redemption", year: 1994 }
        ]
    }
}

export const ai = new AIService()
