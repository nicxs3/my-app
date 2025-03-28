"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

// Type definitions
interface Team {
  name: string
  logo: string
  color: string
  secondaryColor: string
  score: number
  players?: Player[]
}

interface Game {
  id: string | number
  homeTeam: Team
  awayTeam: Team
  time: string
  status: string
}

interface Player {
  name: string
  position: string
  minutes: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  fg: string
  threes: string
  ft: string
}

export default function NBAGames() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [expanded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBoxScore, setShowBoxScore] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [boxScoreLoading, setBoxScoreLoading] = useState(false)

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/nba')
        if (!response.ok) {
          throw new Error('Failed to fetch games')
        }
        const data = await response.json()
        console.log('Fetched games data:', data)
        setGames(data.games)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch games')
        setLoading(false)
      }
    }

    fetchGames()

    // Refresh data every minute
    const interval = setInterval(fetchGames, 60000)
    return () => clearInterval(interval)
  }, [])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? games.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === games.length - 1 ? 0 : prev + 1))
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleGameClick = async (game: Game) => {
    console.log('Clicked game:', game)
    setSelectedGame(game)
    setShowBoxScore(true)
    setBoxScoreLoading(true)

    try {
      const response = await fetch(`/api/nba/boxscore?gameId=${game.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch box score')
      }
      const data = await response.json()
      console.log('Box score data:', data)

      // Update the selected game with real player data
      setSelectedGame(prev => {
        if (!prev) return null
        return {
          ...prev,
          homeTeam: {
            ...prev.homeTeam,
            players: data.homeTeam.players
          },
          awayTeam: {
            ...prev.awayTeam,
            players: data.awayTeam.players
          }
        }
      })
    } catch (error) {
      console.error('Error fetching box score:', error)
    } finally {
      setBoxScoreLoading(false)
    }
  }

  // Helper function to format minutes
  const formatMinutes = (minutes: string) => {
    if (!minutes) return '0:00'
    const [mins, secs] = minutes.split(":")
    return `${parseInt(mins)}:${secs.slice(0, 2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">Loading games...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-xl">No games scheduled for today</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">NBA Games</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={toggleSidebar}>
              {sidebarOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative h-[400px] md:h-[500px] overflow-hidden">
            {games.map((game, index) => {
              // Calculate position based on active index
              let position = index - activeIndex
              if (position < 0) position += games.length
              if (position >= games.length) position -= games.length

              // Calculate transform based on position
              let transform = "translateX(0)"
              if (position === 1) transform = "translateX(100%)"
              if (position === games.length - 1) transform = "translateX(-100%)"

              // Calculate z-index (higher for active card)
              const zIndex = expanded ? 10 : games.length - Math.abs(position)

              // Calculate opacity (full for active, less for others)
              const opacity = position === 0 ? 1 : 0.5

              return (
                <div
                  key={game.id}
                  className={`absolute top-0 left-0 w-full h-full transition-all duration-300 ease-in-out ${
                    expanded ? "scale-105" : ""
                  }`}
                  style={{
                    transform,
                    zIndex,
                    opacity,
                  }}
                >
                  <Card 
                    className="h-full bg-gray-800 border-gray-700 overflow-hidden cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleGameClick(game)}
                  >
                    <div className="p-6 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{game.time}</span>
                        </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-8 w-full">
                          {/* Away Team */}
                          <div 
                            className="text-center p-6 rounded-lg"
                            style={{ backgroundColor: game.awayTeam.color }}
                          >
                            <div className="flex items-center justify-center gap-4 mb-4">
                              <div className="relative w-16 h-16">
                                <Image
                                  src={game.awayTeam.logo}
                                  alt={game.awayTeam.name}
                                  fill
                                  className="object-contain drop-shadow-lg"
                                />
                              </div>
                              <h3 className="text-xl font-semibold text-white">{game.awayTeam.name}</h3>
                            </div>
                            <div 
                              className="text-4xl font-bold mt-2"
                              style={{ color: game.awayTeam.secondaryColor }}
                            >
                              {game.awayTeam.score}
                            </div>
                          </div>

                          {/* Home Team */}
                          <div 
                            className="text-center p-6 rounded-lg"
                            style={{ backgroundColor: game.homeTeam.color }}
                          >
                            <div className="flex items-center justify-center gap-4 mb-4">
                              <div className="relative w-16 h-16">
                                <Image
                                  src={game.homeTeam.logo}
                                  alt={game.homeTeam.name}
                                  fill
                                  className="object-contain drop-shadow-lg"
                                />
                              </div>
                              <h3 className="text-xl font-semibold text-white">{game.homeTeam.name}</h3>
                            </div>
                            <div 
                              className="text-4xl font-bold mt-2"
                              style={{ color: game.homeTeam.secondaryColor }}
                            >
                              {game.homeTeam.score}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-center text-sm text-gray-400">
                        {game.status}
                      </div>
                    </div>
                  </Card>
                </div>
              )
            })}
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handlePrevious}
              className="rounded-full bg-gray-800/80 border-gray-700 text-white hover:bg-gray-700 backdrop-blur-sm transform transition hover:scale-110"
            >
              <ChevronLeft className="h-8 w-8" />
              <span className="sr-only">Previous game</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleNext}
              className="rounded-full bg-gray-800/80 border-gray-700 text-white hover:bg-gray-700 backdrop-blur-sm transform transition hover:scale-110"
            >
              <ChevronRight className="h-8 w-8" />
              <span className="sr-only">Next game</span>
            </Button>
          </div>

          {/* Game indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {games.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all transform ${
                  index === activeIndex 
                    ? "bg-white scale-125" 
                    : "bg-gray-600 hover:bg-gray-500"
                }`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player Stats Modal */}
      <Dialog open={showBoxScore} onOpenChange={setShowBoxScore}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-6xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedGame?.awayTeam.name} vs {selectedGame?.homeTeam.name}
            </DialogTitle>
          </DialogHeader>
          
          {boxScoreLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-xl">Loading box score...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              {/* Away Team Stats */}
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: selectedGame?.awayTeam.color }}>
                  {selectedGame?.awayTeam.name}
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-gray-700/50">
                        <TableHead>Player</TableHead>
                        <TableHead>POS</TableHead>
                        <TableHead>MIN</TableHead>
                        <TableHead>PTS</TableHead>
                        <TableHead>REB</TableHead>
                        <TableHead>AST</TableHead>
                        <TableHead>STL</TableHead>
                        <TableHead>BLK</TableHead>
                        <TableHead>FG</TableHead>
                        <TableHead>3PT</TableHead>
                        <TableHead>FT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGame?.awayTeam.players && selectedGame.awayTeam.players.length > 0 ? (
                        selectedGame.awayTeam.players.map((player, index) => (
                          <TableRow key={index} className="hover:bg-gray-700/50">
                            <TableCell className="font-medium whitespace-nowrap">{player.name}</TableCell>
                            <TableCell>{player.position}</TableCell>
                            <TableCell>{formatMinutes(player.minutes)}</TableCell>
                            <TableCell>{player.points}</TableCell>
                            <TableCell>{player.rebounds}</TableCell>
                            <TableCell>{player.assists}</TableCell>
                            <TableCell>{player.steals}</TableCell>
                            <TableCell>{player.blocks}</TableCell>
                            <TableCell>{player.fg}</TableCell>
                            <TableCell>{player.threes}</TableCell>
                            <TableCell>{player.ft}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center">No player data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Home Team Stats */}
              <div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: selectedGame?.homeTeam.color }}>
                  {selectedGame?.homeTeam.name}
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-gray-700/50">
                        <TableHead>Player</TableHead>
                        <TableHead>POS</TableHead>
                        <TableHead>MIN</TableHead>
                        <TableHead>PTS</TableHead>
                        <TableHead>REB</TableHead>
                        <TableHead>AST</TableHead>
                        <TableHead>STL</TableHead>
                        <TableHead>BLK</TableHead>
                        <TableHead>FG</TableHead>
                        <TableHead>3PT</TableHead>
                        <TableHead>FT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedGame?.homeTeam.players && selectedGame.homeTeam.players.length > 0 ? (
                        selectedGame.homeTeam.players.map((player, index) => (
                          <TableRow key={index} className="hover:bg-gray-700/50">
                            <TableCell className="font-medium whitespace-nowrap">{player.name}</TableCell>
                            <TableCell>{player.position}</TableCell>
                            <TableCell>{formatMinutes(player.minutes)}</TableCell>
                            <TableCell>{player.points}</TableCell>
                            <TableCell>{player.rebounds}</TableCell>
                            <TableCell>{player.assists}</TableCell>
                            <TableCell>{player.steals}</TableCell>
                            <TableCell>{player.blocks}</TableCell>
                            <TableCell>{player.fg}</TableCell>
                            <TableCell>{player.threes}</TableCell>
                            <TableCell>{player.ft}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center">No player data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

