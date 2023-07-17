import prisma from '@/lib/prisma'
import { Typebot } from '@typebot.io/schemas'
import { NextApiRequest, NextApiResponse } from 'next'
import { methodNotAllowed } from '@typebot.io/lib/api'
import { parseSampleResult } from '@/features/blocks/integrations/webhook/parseSampleResult'
import { getPreviouslyLinkedTypebots } from '@/features/blocks/logic/typebotLink/getPreviouslyLinkedTypebots'
import { authenticateUser } from '@/helpers/authenticateUser'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await authenticateUser(req)
  if (!user) return res.status(401).json({ message: 'Not authenticated' })
  if (req.method === 'GET') {
    const typebotId = req.query.typebotId as string
    const groupId = req.query.groupId as string
    const typebot = (await prisma.typebot.findFirst({
      where: {
        id: typebotId,
        workspace: { members: { some: { userId: user.id } } },
      },
    })) as unknown as Typebot | undefined
    if (!typebot) return res.status(400).send({ message: 'Typebot not found' })
    const linkedTypebots = await getPreviouslyLinkedTypebots({
      isPreview: true,
      typebots: [typebot],
      user,
    })([])
    return res.send(
      await parseSampleResult(typebot, linkedTypebots)(groupId, [])
    )
  }
  methodNotAllowed(res)
}

export default handler
