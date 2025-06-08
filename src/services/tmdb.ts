import { z } from "zod"

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ""
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export const ImageSizes = {
    poster: {
        small: `${TMDB_IMAGE_BASE}/w185`,
        medium: `${TMDB_IMAGE_BASE}/w342`,
        large: `${TMDB_IMAGE_BASE}/w500`,
        original: `${TMDB_IMAGE_BASE}/original`
    },
    backdrop: {
        small: `${TMDB_IMAGE_BASE}/w300`,
        medium: `${TMDB_IMAGE_BASE}/w780`,
        large: `${TMDB_IMAGE_BASE}/w1280`,
        original: `${TMDB_IMAGE_BASE}/original`
    }
} as const

const MovieSchema = z.object({
    id: z.number(),
    title: z.string(),
    overview: z.string().optional(),
    release_date: z.string().optional(),
    poster_path: z.string().nullable(),
    backdrop_path: z.string().nullable(),
    genre_ids: z.array(z.number()).optional(),
    vote_average: z.number().optional(),
    vote_count: z.number().optional()
})

const MovieDetailsSchema = MovieSchema.extend({
    genres: z.array(
        z.object({
            id: z.number(),
            name: z.string()
        })
    ),
    runtime: z.number().nullable(),
    tagline: z.string().nullable()
})

const CastMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    character: z.string().optional(),
    profile_path: z.string().nullable(),
    order: z.number().optional()
})

const CrewMemberSchema = z.object({
    id: z.number(),
    name: z.string(),
    job: z.string(),
    department: z.string(),
    profile_path: z.string().nullable()
})

const CreditsSchema = z.object({
    cast: z.array(CastMemberSchema),
    crew: z.array(CrewMemberSchema)
})

export type Movie = z.infer<typeof MovieSchema>
export type MovieDetails = z.infer<typeof MovieDetailsSchema>
export type CastMember = z.infer<typeof CastMemberSchema>
export type CrewMember = z.infer<typeof CrewMemberSchema>
export type Credits = z.infer<typeof CreditsSchema>

class TMDBService {
    private apiKey: string
    private cache: Map<string, { data: any; timestamp: number }> = new Map()
    private cacheTTL = 5 * 60 * 1000 // 5 minutes

    constructor() {
        this.apiKey = TMDB_API_KEY
        if (!this.apiKey) {
            console.warn(
                "TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable."
            )
        }
    }

    private getCacheKey(endpoint: string, params?: Record<string, any>): string {
        return `${endpoint}${params ? JSON.stringify(params) : ""}`
    }

    private getFromCache(key: string): any | null {
        const cached = this.cache.get(key)
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data
        }
        this.cache.delete(key)
        return null
    }

    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() })
    }

    private async fetchFromTMDB<T>(
        endpoint: string,
        params?: Record<string, any>,
        schema?: z.ZodSchema<T>
    ): Promise<T> {
        const cacheKey = this.getCacheKey(endpoint, params)
        const cached = this.getFromCache(cacheKey)
        if (cached) {
            return cached
        }

        const url = new URL(`${TMDB_BASE_URL}${endpoint}`)
        url.searchParams.append("api_key", this.apiKey)

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value))
                }
            })
        }

        const response = await fetch(url.toString())

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const result = schema ? schema.parse(data) : data

        this.setCache(cacheKey, result)
        return result
    }

    async searchMovies(query: string, page = 1) {
        const response = await this.fetchFromTMDB("/search/movie", {
            query,
            page,
            include_adult: false
        })

        return {
            ...response,
            results: response.results.map((movie: any) => MovieSchema.parse(movie))
        }
    }

    async getMovieDetails(movieId: number): Promise<MovieDetails> {
        return this.fetchFromTMDB(`/movie/${movieId}`, {}, MovieDetailsSchema)
    }

    async getMovieCredits(movieId: number): Promise<Credits> {
        return this.fetchFromTMDB(`/movie/${movieId}/credits`, {}, CreditsSchema)
    }

    async getTrendingMovies(timeWindow: "day" | "week" = "week", page = 1) {
        const response = await this.fetchFromTMDB(`/trending/movie/${timeWindow}`, {
            page
        })

        return {
            ...response,
            results: response.results.map((movie: any) => MovieSchema.parse(movie))
        }
    }

    async getMovieRecommendations(movieId: number, page = 1) {
        const response = await this.fetchFromTMDB(`/movie/${movieId}/recommendations`, {
            page
        })

        return {
            ...response,
            results: response.results.map((movie: any) => MovieSchema.parse(movie))
        }
    }

    async getSimilarMovies(movieId: number, page = 1) {
        const response = await this.fetchFromTMDB(`/movie/${movieId}/similar`, {
            page
        })

        return {
            ...response,
            results: response.results.map((movie: any) => MovieSchema.parse(movie))
        }
    }

    getImageUrl(
        path: string | null,
        size: keyof typeof ImageSizes.poster = "medium"
    ): string | null {
        if (!path) return null
        return `${ImageSizes.poster[size]}${path}`
    }

    getBackdropUrl(
        path: string | null,
        size: keyof typeof ImageSizes.backdrop = "medium"
    ): string | null {
        if (!path) return null
        return `${ImageSizes.backdrop[size]}${path}`
    }
}

export const tmdb = new TMDBService()
