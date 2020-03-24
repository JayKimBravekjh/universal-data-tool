// @flow

import React, { useState, useEffect, useMemo } from "react"
import useEventCallback from "use-event-callback"
import { styled } from "@material-ui/core/styles"
import Button from "@material-ui/core/Button"
import CheckBoxIcon from "@material-ui/icons/CheckBox"
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank"
import * as colors from "@material-ui/core/colors"
import Checkbox from "@material-ui/core/Checkbox"
import without from "lodash/without"

const brightColors = [
  colors.blue[600],
  colors.green[600],
  colors.red[600],
  colors.deepOrange[600],
  colors.pink[600],
  colors.teal[600],
  colors.deepPurple[600],
  colors.indigo[600],
  colors.blue[600],
  colors.cyan[600],
  colors.purple[600]
]

const letters = "abcdefghijklmnopqrstuvwxyz1234567890".split("")
const getRandomColor = label => {
  const hashInt = label.id
    .split("")
    .reduce((acc, v, i) => acc + (letters.indexOf(v) + 1), 0)
  return brightColors[hashInt % brightColors.length]
}

const Container = styled("div")({ maxWidth: "100vw" })

const ImageContainer = styled("div")({
  maxHeight: "50vh"
})

const Image = styled("img")({
  display: "inline-block",
  width: "100%",
  height: "100%",
  maxHeight: "50vh",
  objectFit: "contain"
})

const Nav = styled("div")({
  display: "flex",
  justifyContent: "center",
  marginTop: 4
})
const NavItem = styled("div")({
  backgroundColor: "#000",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& > span": {
    padding: 16
  }
})
const NavButton = styled(Button)({
  color: "#fff",
  padding: 8,
  paddingLeft: 16,
  paddingRight: 16
})

const ButtonsContainer = styled("div")({
  paddingLeft: 50,
  paddingRight: 50,
  marginTop: 8,
  textAlign: "center"
})

const CheckButton = styled(Button)({
  margin: 8,
  color: "#fff",
  fontSize: 18,
  paddingRight: 16,
  transition: "transform 50ms ease"
})

const [emptyObj, emptyArr] = [{}, []]

export default ({
  sampleIndex: globalSampleIndex,
  interface: iface,
  taskData = emptyArr,
  taskOutput = emptyObj,
  containerProps = emptyObj,
  onSaveTaskOutputItem
}) => {
  const [sampleIndex, changeSampleIndex] = useState(0)
  const [enlargedLabel, changeEnlargedLabel] = useState(null)
  const [currentOutput, changeCurrentOutput] = useState(emptyArr)
  const labels = useMemo(
    () =>
      iface.availableLabels.map(l =>
        typeof l === "string" ? { id: l, description: l } : l
      ),
    [iface.availableLabels]
  )

  const onDone = useEventCallback(newOutput => {
    if (containerProps.onExit) containerProps.onExit()
  })
  const onNext = useEventCallback(newOutput => {
    onSaveTaskOutputItem(sampleIndex, newOutput || currentOutput)
    if (sampleIndex !== taskData.length - 1) {
      changeSampleIndex(sampleIndex + 1)
    } else {
      if (containerProps.onExit) containerProps.onExit("go-to-next")
    }
  })
  const onPrev = useEventCallback(() => {
    if (sampleIndex > 0) {
      changeSampleIndex(sampleIndex - 1)
    } else {
      if (containerProps.onExit) containerProps.onExit("go-to-previous")
    }
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      changeEnlargedLabel(null)
    }, 100)
    return () => clearTimeout(timeout)
  }, [enlargedLabel])

  const onClickLabel = useEventCallback(label => {
    changeEnlargedLabel(label)
    let newOutput
    if ((currentOutput || []).includes(label.id)) {
      newOutput = without(currentOutput, label.id)
    } else {
      if (iface.allowMultiple) {
        newOutput = currentOutput.concat([label.id])
      } else {
        newOutput = [label.id]
      }
    }

    changeCurrentOutput(newOutput)
    if (!iface.allowMultiple && newOutput.length > 0) {
      onNext(newOutput)
    }
  })

  useEffect(() => {
    let newOutput = (taskOutput || [])[sampleIndex]
    if (!newOutput) newOutput = []
    if (typeof newOutput === "string") newOutput = [newOutput]
    changeCurrentOutput(newOutput)
  }, [sampleIndex, globalSampleIndex])

  const [hotkeyMap, labelKeyMap] = useMemo(() => {
    const hotkeyMap = {
      " ": onNext,
      backspace: onPrev,
      enter: onDone,
      rightarrow: onNext,
      leftarrow: onPrev
    }
    const labelKeyMap = {}
    for (let label of labels) {
      const nextAvailableLetter = label.id
        .split("")
        .filter(l => letters.includes(l))
        .find(l => !hotkeyMap[l.toLowerCase()])
      if (!nextAvailableLetter) continue
      hotkeyMap[nextAvailableLetter] = () => onClickLabel(label)
      labelKeyMap[label.id] = nextAvailableLetter
    }
    return [hotkeyMap, labelKeyMap]
  }, [labels])

  useEffect(() => {
    const onKeyDown = e => {
      const key = e.key.toLowerCase()
      if (hotkeyMap[key]) {
        hotkeyMap[key]()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [hotkeyMap])

  return (
    <Container>
      <ImageContainer>
        <Image src={taskData[sampleIndex].imageUrl} />
      </ImageContainer>
      <Nav>
        <NavItem>
          <NavButton onClick={onPrev}>Prev (backspace)</NavButton>
        </NavItem>
        {taskData.length > 1 ? (
          <NavItem>
            <span>
              ({sampleIndex + 1}/{taskData.length})
            </span>
          </NavItem>
        ) : globalSampleIndex !== undefined ? (
          <NavItem>
            <span>[{globalSampleIndex}]</span>
          </NavItem>
        ) : null}
        <NavItem>
          <NavButton onClick={onNext}>Next (space)</NavButton>
        </NavItem>
        <NavItem>
          <NavButton onClick={onDone}>Done (enter)</NavButton>
        </NavItem>
      </Nav>
      <ButtonsContainer>
        {labels.map(label => (
          <CheckButton
            key={label.id}
            onClick={() => onClickLabel(label)}
            style={{
              backgroundColor: getRandomColor(label),
              transform: enlargedLabel === label ? "scale(1.1,1.1)" : undefined
            }}
          >
            <Checkbox
              style={{ color: "#fff" }}
              checked={currentOutput.includes(label.id)}
            />
            {label.id}
            {labelKeyMap[label.id] ? ` (${labelKeyMap[label.id]})` : ""}
          </CheckButton>
        ))}
      </ButtonsContainer>
    </Container>
  )
}
