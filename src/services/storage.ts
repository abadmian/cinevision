import { z } from "zod"

const RatingSchema = z.object({
    movieId: z.number(),
    rating: z.number().min(1).max(5),
    timestamp: z.number()
})

const WatchlistItemSchema = z.object({
    movieId: z.number(),
    addedAt: z.number()
})

const UserDataSchema = z.object({
    ratings: z.record(z.string(), RatingSchema),
    watchlist: z.record(z.string(), WatchlistItemSchema)
})

export type Rating = z.infer<typeof RatingSchema>
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>
export type UserData = z.infer<typeof UserDataSchema>

class StorageService {
    private storageKey = "cinevision_user_data"

    private getDefaultData(): UserData {
        return {
            ratings: {},
            watchlist: {}
        }
    }

    private loadData(): UserData {
        try {
            const stored = localStorage.getItem(this.storageKey)
            if (!stored) {
                return this.getDefaultData()
            }

            const parsed = JSON.parse(stored)
            return UserDataSchema.parse(parsed)
        } catch (error) {
            console.error("Failed to load user data:", error)
            return this.getDefaultData()
        }
    }

    private saveData(data: UserData): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data))
        } catch (error) {
            console.error("Failed to save user data:", error)
        }
    }

    getRating(movieId: number): number | null {
        const data = this.loadData()
        const rating = data.ratings[movieId.toString()]
        return rating ? rating.rating : null
    }

    setRating(movieId: number, rating: number): void {
        const data = this.loadData()
        data.ratings[movieId.toString()] = {
            movieId,
            rating,
            timestamp: Date.now()
        }
        this.saveData(data)
    }

    removeRating(movieId: number): void {
        const data = this.loadData()
        delete data.ratings[movieId.toString()]
        this.saveData(data)
    }

    getAllRatings(): Rating[] {
        const data = this.loadData()
        return Object.values(data.ratings).sort((a, b) => b.timestamp - a.timestamp)
    }

    getFavoriteMovies(): Rating[] {
        return this.getAllRatings().filter((r) => r.rating >= 4)
    }

    isInWatchlist(movieId: number): boolean {
        const data = this.loadData()
        return movieId.toString() in data.watchlist
    }

    addToWatchlist(movieId: number): void {
        const data = this.loadData()
        data.watchlist[movieId.toString()] = {
            movieId,
            addedAt: Date.now()
        }
        this.saveData(data)
    }

    removeFromWatchlist(movieId: number): void {
        const data = this.loadData()
        delete data.watchlist[movieId.toString()]
        this.saveData(data)
    }

    getWatchlist(): WatchlistItem[] {
        const data = this.loadData()
        return Object.values(data.watchlist).sort((a, b) => b.addedAt - a.addedAt)
    }

    clearAllData(): void {
        localStorage.removeItem(this.storageKey)
    }

    exportData(): UserData {
        return this.loadData()
    }

    importData(data: UserData): void {
        try {
            const validated = UserDataSchema.parse(data)
            this.saveData(validated)
        } catch (error) {
            console.error("Failed to import user data:", error)
            throw new Error("Invalid data format")
        }
    }
}

export const storage = new StorageService()
